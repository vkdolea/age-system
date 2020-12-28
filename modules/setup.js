export function charSheetSetup(app, html, data) {
  const teste = data;
  let ageCard = html.find(".base-age-roll");
  if (ageCard.length > 0) {
      if (teste === null) {
          if (teste === null) {
              html.find(".blind-roll-card").css("display", "none");
          } else {
              html.find(".regular-roll-card").css("display", "none");
          };
      } else {
          html.find(".blind-roll-card").css("display", "none");
      };
  };
};