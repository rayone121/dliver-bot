/*const userStates = {};
const SESSION_TIMEOUT = 1 * 30 * 1000; // 30 seconds
const REMINDER_TIMEOUT = 1 * 25 * 1000; // 25 secons


function setSessionTimeout(userPhone) {
    if (userStates[userPhone].timeout) {
      clearTimeout(userStates[userPhone].timeout);
    }
    if (userStates[userPhone].reminderTimeout) {
      clearTimeout(userStates[userPhone].reminderTimeout);
    }
  
    userStates[userPhone].reminderTimeout = setTimeout(async () => {
      await sendMessage(userPhone, "Your session will expire in 5 seconds. Please complete your interaction.");
    }, REMINDER_TIMEOUT);
  
    userStates[userPhone].timeout = setTimeout(() => {
      delete userStates[userPhone];
    }, SESSION_TIMEOUT);
  }

async function endSession(userPhone) {
  if (userStates[userPhone].timeout) {
    clearTimeout(userStates[userPhone].timeout);
  }
  if (userStates[userPhone].reminderTimeout) {
    clearTimeout(userStates[userPhone].reminderTimeout);
  }
  await sendMessage(userPhone, "Aceasta sesiune a fost inchisa. Va rugam sa trimiteti un mesaj cu /start pentru a incepe o noua sesiune.");
  delete userStates[userPhone];
}


if (!userStates[userPhone]) {
    userStates[userPhone] = { state: 'start' };
  }

  const userState = userStates[userPhone];
  setSessionTimeout(userPhone);

  try {
    switch (userState.state) {
        case 'start':
            if (userMessage === '/start') {
              userState.state = 'initial';
              await sendMessage(userPhone, "Bine ati venit! Va rugam asteptati pana la verificarea numarului de telefon.");
              
              // Automatically proceed to the next state
              const user = await getUser(userPhone);
              if (!user) {
                userState.state = 'awaitingVat';
                await sendMessage(userPhone, "Numarul de telefon nu a fost identificat in baza noastra de date. Va rugam sa introduceti codul fiscal. (Exemplu: ROXXXXXXX sau XXXXXXX).");
              } else {
                userState.state = 'verified';
                await sendMessage(userPhone, "Sunteti deja verificat. Va rugam sa trimiteti comanda.");
              }
            } else {
              await sendMessage(userPhone, "Pentru a incepe, va rugam sa trimiteti un mesaj cu /start.");
            }
        break;
      case 'awaitingVat':
        const vatNumber = userMessage;
        const vatUser = await checkVatNumber(vatNumber);
        if (vatUser) {
          await updatePhone(userPhone, vatUser.vat);
          userState.state = 'verified';
          await sendMessage(userPhone, "Verificare reusita. Va rugam sa trimiteti comanda.");
        } else {
          await sendMessage(userPhone, "Cod fiscal invalid. Va rugam sa incercati din nou.");
        }
        break;

      case 'verified':
        userState.state = 'awaitingConfirmation';
        userState.order = userMessage;
        await sendMessage(userPhone, `Comanda dumneavoastra este: ${userMessage}. Va rugam sa confirmati comanda cu 'da' sau 'nu'.`);
        break;

      case 'awaitingConfirmation':
        if (userMessage === 'da') {
          await sendMessage(userPhone, "Comanda dumneavoastra a fost confirmata si va fi procesata. Va multumim!");
          await endSession(userPhone);
        } else if (userMessage === 'nu') {
          userState.state = 'verified';
          await sendMessage(userPhone, "Comanda dumneavoastra a fost anulata. Va rugam sa trimiteti o noua comanda.");
        } else {
          await sendMessage(userPhone, "Va rugam sa confirmati comanda cu 'da' sau 'nu'.");
        }
        break;

      default:
        await sendMessage(userPhone, "Ceva nu a mers bine. Va rugam sa incercati din nou.");
        break;
    }
  } catch (error) {
    logStream.write(`Error handling webhook: ${error}\n`);
    await sendMessage(userPhone, "Ceva nu a mers bine. Va rugam sa incercati din nou.");
  }

  */