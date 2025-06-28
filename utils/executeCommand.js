const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');


async function executeCommand(command) {
    const writeFileRegex = /^echo\s+"([\s\S]*)"\s+>\s+(.*)$/;
     console.log("--------------IM HERE-----------------");
    // Intercept echo-based file writes
    const match = command.match(writeFileRegex);
    if (match) {
        const content = match[1]
            .replace(/\\"/g, '"')  // unescape quotes
            .replace(/\\n/g, '\n'); // support newline escaping if needed
        const filePath = match[2].trim();

        try {
            const fullPath = path.resolve(filePath);
            await fs.writeFile(fullPath, content, 'utf8');
            return `File ${filePath} written successfully.`;
        } catch (err) {
            throw new Error(`Failed to write file ${filePath}: ${err.message}`);
        }
    }

    // Otherwise, run as shell command
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(`Error executing command: ${error.message}`);
            }
            resolve(`stdout: ${stdout}\nstderr: ${stderr}`);
        });
    });
}

module.exports = executeCommand;