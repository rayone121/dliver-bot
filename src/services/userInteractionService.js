import { getUser, checkVatNumber, updatePhone,getClientName,getClientNameByPhone } from "./clientService.js";
import { logStream } from "../server.js"; 
import { whatsappService } from "./whatsappMessageService.js"; 
import { adbSmsService} from "./smsMessageService.js"; 

const userStates = {};
const SESSION_TIMEOUT = 60 * 60 * 1000; // 30 seconds
const REMINDER_TIMEOUT = 30 * 60 * 1000; // 25 seconds

// Updated setSessionTimeout to use userKey
function setSessionTimeout(userKey, messageService) {
    const userState = userStates[userKey];
    if (userState.timeout) {
        clearTimeout(userState.timeout);
        logStream.write(`Cleared existing session timeout for ${userKey}\n`);
    }
    if (userState.reminderTimeout) {
        clearTimeout(userState.reminderTimeout);
        logStream.write(`Cleared existing reminder timeout for ${userKey}\n`);
    }

    userState.reminderTimeout = setTimeout(async () => {
        await messageService.sendMessage(userState.phone, "Your session will expire in 30 minutes. Please complete your interaction.");
        logStream.write(`Sent reminder message to ${userState.phone}\n`);
    }, REMINDER_TIMEOUT);

    userState.timeout = setTimeout(async () => {
        await endSession(userKey, messageService);
        logStream.write(`Session timeout occurred for ${userKey}\n`);
    }, SESSION_TIMEOUT);

    logStream.write(`Set session timeout and reminder timeout for ${userKey}\n`);
}

// Updated endSession to use userKey
async function endSession(userKey, messageService) {
    const userState = userStates[userKey];
    if (userState.timeout) {
        clearTimeout(userState.timeout);
        logStream.write(`Cleared session timeout for ${userKey} in endSession\n`);
    }
    if (userState.reminderTimeout) {
        clearTimeout(userState.reminderTimeout);
        logStream.write(`Cleared reminder timeout for ${userKey} in endSession\n`);
    }
    await messageService.sendMessage(userState.phone, "Aceasta sesiune a fost inchisa...");
    delete userStates[userKey];
    logStream.write(`Ended session for ${userKey}\n`);
}



export async function handleUserInteraction(userPhone, userMessage, platform) {
    let messageService;
    if (platform === 'whatsapp') {
        messageService = whatsappService;
    } else if (platform === 'sms') {
        messageService = adbSmsService;
    } else {
        throw new Error('Invalid platform');
    }

    // 🎯 Key change: Combine phone and platform for session key
    const userKey = `${userPhone}-${platform}`;
    
    if (!userStates[userKey]) {
        userStates[userKey] = { 
            state: 'start',
            phone: userPhone, // Store phone for messaging
            platform: platform
        };
        logStream.write(`Initialized state for new user ${userKey}\n`);
    }

    const userState = userStates[userKey];
    setSessionTimeout(userKey, messageService); // Pass userKey instead of phone

    try {
        switch (userState.state) {
            case 'start':
                if (userMessage === '/start') {
                    userState.state = 'initial';
                    await messageService.sendMessage(userPhone, "Bine ati venit! Va rugam asteptati pana la verificarea numarului de telefon.");

                    const user = await getUser(userState.phone);
                    if (!user) {
                        userState.state = 'awaitingVat';
                        await messageService.sendMessage(userPhone, "Numarul de telefon nu a fost identificat in baza noastra de date. Va rugam sa introduceti codul fiscal. (Exemplu: ROXXXXXXX sau XXXXXXX).");
                    } else {
                        const clientName = await getClientNameByPhone(userState.phone);
                        userState.state = 'verified';
                        await messageService.sendMessage(userPhone, `Bun venit, ${clientName}! Numarul dumneavoastra de telefon a fost verificat. Va rugam sa trimiteti comanda.`); 
                    }
                }
                else {
                    await messageService.sendMessage(userPhone, "Va rugam sa trimiteti /start pentru a incepe.");
                }
                break;

            case 'awaitingVat':
                const vatUser = await checkVatNumber(userMessage);
                if(Object.keys(vatUser).length === 0){
                    await messageService.sendMessage(userState.phone, "Codul fiscal nu a fost gasit in baza noastra de date. Va rugam sa introduceti un cod fiscal valid.");
                    break;
                }
                const ClientName = await getClientName(vatUser.vat);
                await updatePhone(userState.phone, vatUser.vat);
                userState.state = 'verified';
                await messageService.sendMessage(userState.phone, `Bun venit, ${ClientName}! Numarul dumneavoastra de telefon a fost verificat. Va rugam sa trimiteti comanda.`);
                break;
            case 'verified':
                userState.state = 'awaitingConfirmation';
                userState.order = userMessage;
                await messageService.sendMessage(userState.phone, `Comanda dumneavoastra este: ${userMessage}. Confirmati comanda? (da/nu)`);
                break;

            case 'awaitingConfirmation':
                if (userMessage === 'da') {
                    await messageService.sendMessage(userPhone, "Comanda dumneavoastra a fost confirmata si va fi procesata. Va multumim!");
                    await endSession(userKey, messageService);
                    break;
                } else if (userMessage === 'nu') {
                    userState.state = 'verified';
                    await messageService.sendMessage(userPhone, "Comanda dumneavoastra a fost anulata. Va rugam sa trimiteti o noua comanda.");
                    break;
                }
                await messageService.sendMessage(userPhone, "Va rugam sa raspundeti cu 'da' sau 'nu'.");
                break;

            default:
                await messageService.sendMessage(userState.phone, "Ceva nu a mers bine...");
        }
    } catch (error) {
        logStream.write(`Error handling user interaction for ${userKey}: ${error}\n`);
        await messageService.sendMessage(userState.phone, "Ceva nu a mers bine...");
    }
}