import { getUser, checkVatNumber, updatePhone } from "./clientService.js";
import { logStream } from "../server.js";
import { WhatsAppMessageService, whatsappService } from "./whatsappMessageService.js";
import { adbSmsService, AdbSmsService } from "./smsMessageService.js";

// ...existing code...

const userStates = {};
const SESSION_TIMEOUT = 60 * 60 * 1000; // 30 seconds
const REMINDER_TIMEOUT = 30 * 60 * 1000; // 25 seconds

function setSessionTimeout(userPhone, messageService) {
    if (userStates[userPhone].timeout) {
        clearTimeout(userStates[userPhone].timeout);
        logStream.write(`Cleared existing session timeout for ${userPhone}\n`);
    }
    if (userStates[userPhone].reminderTimeout) {
        clearTimeout(userStates[userPhone].reminderTimeout);
        logStream.write(`Cleared existing reminder timeout for ${userPhone}\n`);
    }

    userStates[userPhone].reminderTimeout = setTimeout(async () => {
        await messageService.sendMessage(userPhone, "Your session will expire in 30 minutes. Please complete your interaction.");
        logStream.write(`Sent reminder message to ${userPhone}\n`);
    }, REMINDER_TIMEOUT);

    userStates[userPhone].timeout = setTimeout(async () => {
        await endSession(userPhone, messageService);
        logStream.write(`Session timeout occurred for ${userPhone}\n`);
    }, SESSION_TIMEOUT);

    logStream.write(`Set session timeout and reminder timeout for ${userPhone}\n`);
}

async function endSession(userPhone, messageService) {
    if (userStates[userPhone].timeout) {
        clearTimeout(userStates[userPhone].timeout);
        logStream.write(`Cleared session timeout for ${userPhone} in endSession\n`);
    }
    if (userStates[userPhone].reminderTimeout) {
        clearTimeout(userStates[userPhone].reminderTimeout);
        logStream.write(`Cleared reminder timeout for ${userPhone} in endSession\n`);
    }
    await messageService.sendMessage(userPhone, "Aceasta sesiune a fost inchisa. Va rugam sa trimiteti un mesaj cu /start pentru a incepe o noua sesiune.");
    delete userStates[userPhone];
    logStream.write(`Ended session for ${userPhone}\n`);
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

    if (!userStates[userPhone]) {
        userStates[userPhone] = { state: 'start' };
        logStream.write(`Initialized state for new user ${userPhone}\n`);
    }

    const userState = userStates[userPhone];
    setSessionTimeout(userPhone, messageService);

    try {
        switch (userState.state) {
            case 'start':
                if (userMessage === '/start') {
                    userState.state = 'initial';
                    await messageService.sendMessage(userPhone, "Bine ati venit! Va rugam asteptati pana la verificarea numarului de telefon.");
                    logStream.write(`User ${userPhone} sent /start, proceeding to initial state\n`);

                    // Automatically proceed to the next state
                    const user = await getUser(userPhone);
                    if (!user) {
                        userState.state = 'awaitingVat';
                        await messageService.sendMessage(userPhone, "Numarul de telefon nu a fost identificat in baza noastra de date. Va rugam sa introduceti codul fiscal. (Exemplu: ROXXXXXXX sau XXXXXXX).");
                        logStream.write(`User ${userPhone} not found, awaiting VAT number\n`);
                    } else {
                        userState.state = 'verified';
                        await messageService.sendMessage(userPhone, "Sunteti deja verificat. Va rugam sa trimiteti comanda.");
                        logStream.write(`User ${userPhone} verified, awaiting order\n`);
                    }
                } else {
                    await messageService.sendMessage(userPhone, "Pentru a incepe, va rugam sa trimiteti un mesaj cu /start.");
                    logStream.write(`User ${userPhone} sent invalid start message\n`);
                }
                break;
            case 'awaitingVat':
                const vatNumber = userMessage;
                const vatUser = await checkVatNumber(vatNumber);
                if (vatUser) {
                    await updatePhone(userPhone, vatUser.vat);
                    userState.state = 'verified';
                    await messageService.sendMessage(userPhone, "Verificare reusita. Va rugam sa trimiteti comanda.");
                    logStream.write(`User ${userPhone} VAT verified, awaiting order\n`);
                } else {
                    await messageService.sendMessage(userPhone, "Cod fiscal invalid. Va rugam sa incercati din nou.");
                    logStream.write(`User ${userPhone} sent invalid VAT number\n`);
                }
                break;

            case 'verified':
                userState.state = 'awaitingConfirmation';
                userState.order = userMessage;
                await messageService.sendMessage(userPhone, "Comanda dumneavoastra este: " + userMessage + ".");
                await messageService.sendMessage(userPhone, "Va rugam sa confirmati comanda cu 'da' sau 'nu'.");
                logStream.write(`User ${userPhone} sent order, awaiting confirmation\n`);
                break;

            case 'awaitingConfirmation':
                if (userMessage === 'da') {
                    await messageService.sendMessage(userPhone, "Comanda dumneavoastra a fost confirmata si va fi procesata. Va multumim!");
                    await endSession(userPhone, messageService);
                    logStream.write(`User ${userPhone} confirmed order, session ended\n`);
                } else if (userMessage === 'nu') {
                    userState.state = 'verified';
                    await messageService.sendMessage(userPhone, "Comanda dumneavoastra a fost anulata. Va rugam sa trimiteti o noua comanda.");
                    logStream.write(`User ${userPhone} canceled order, awaiting new order\n`);
                } else {
                    await messageService.sendMessage(userPhone, "Va rugam sa confirmati comanda cu 'da' sau 'nu'.");
                    logStream.write(`User ${userPhone} sent invalid confirmation\n`);
                }
                break;

            default:
                await messageService.sendMessage(userPhone, "Ceva nu a mers bine. Va rugam sa incercati din nou.");
                logStream.write(`User ${userPhone} in unknown state\n`);
                break;
        }
    } catch (error) {
        logStream.write(`Error handling user interaction for ${userPhone}: ${error}\n`);
        await messageService.sendMessage(userPhone, "Ceva nu a mers bine. Va rugam sa incercati din nou.");
    }
}