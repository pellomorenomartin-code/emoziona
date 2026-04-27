export const getEmotionalInsight = async (emotion: string, quadrant: string) => {
  return "Hartu une bat arnasa hartzeko eta zure emozioa onartzeko. Hori da lehen pausoa hobeto egoteko.";
};

export const getHealthRecommendations = async (
  steps: number,
  sleepHours: number,
  language: string
) => {
  return language === "es"
    ? "Intenta descansar bien, moverte un poco cada día y escuchar cómo te sientes."
    : "Saiatu ondo atseden hartzen, egunero pixka bat mugitzen eta nola sentitzen zaren entzuten.";
};

export const getJournalFeedback = async (content: string, language: string) => {
  return language === "es"
    ? "Gracias por compartir tus sentimientos. Es un gran paso."
    : "Eskerrik asko zure sentimenduak partekatzeagatik. Urrats handia da.";
};

export const getEmpathyFeedback = async (content: string, language: string) => {
  return language === "es"
    ? "Tu respuesta muestra empatía. Buen trabajo."
    : "Zure erantzunak enpatia erakusten du. Lan bikaina.";
};
