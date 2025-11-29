const fs = require('fs');
const path = require('path');

function generateAutolinking() {
  const autolinkingDir = path.resolve(__dirname, '..', 'android', 'build', 'generated', 'autolinking');
  if (!fs.existsSync(autolinkingDir)) fs.mkdirSync(autolinkingDir, { recursive: true });

  const autolinkingFile = path.join(autolinkingDir, 'autolinking.json');
  if (!fs.existsSync(autolinkingFile)) {
    const content = {
      version: 1,
      dependencies: {},
      platforms: {
        android: {},
        ios: {}
      }
    };
    fs.writeFileSync(autolinkingFile, JSON.stringify(content, null, 2));
    console.log('✅ autolinking.json generated at:', autolinkingFile);
  } else {
    console.log('✔ autolinking.json already exists at:', autolinkingFile);
  }
}

// Esegui direttamente se lo script viene lanciato con node
if (require.main === module) {
  generateAutolinking();
}

// Esporta la funzione così può essere richiamata da react-native.config.js
module.exports = generateAutolinking;
