// Intro Sequence Manager
class IntroSequence {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.asciiArt = document.getElementById('asciiArt');
        this.menuOptions = document.getElementById('menuOptions');
        this.isComplete = false;
        this.codeLines = [];
        this.typingSpeed = 50; // ms between characters
        this.codeSpamSpeed = 20; // ms between lines
    }

    async start() {
        await audioManager.initialize();
        await this.typeCommand();
        await this.spamCode();
        await this.showAsciiArt();
        this.showMenu();
    }

    async typeCommand() {
        const command = "!mission start";
        this.terminal.textContent = "";
        
        for (let char of command) {
            this.terminal.textContent += char;
            audioManager.playSound('typing', true);
            await this.delay(this.typingSpeed);
        }
        
        await this.delay(500);
        this.terminal.textContent += "\n\nINITIALIZING SYSTEMS...\n\n";
    }

    async spamCode() {
        const codePatterns = [
            "0x{HEX} -> MEMORY_ALLOCATION",
            "PROC_{ID}: STATUS_RUNNING",
            "SCAN_SECTOR[{NUM}]: {STATE}",
            "ENERGY_CORE: {LEVEL}% NOMINAL",
            "NAVIGATION: COORD({X},{Y})",
            "COMM_CHANNEL_{CH}: {STATUS}",
            "LIFE_SUPPORT: {METRIC} WNL",
            "THRUSTER_#{ID}: {CONDITION}",
            "RADAR_PING: {RANGE}KM CLEAR",
            "DATA_STREAM: {BYTES}B/s"
        ];

        for (let i = 0; i < 50; i++) {
            const pattern = codePatterns[Math.floor(Math.random() * codePatterns.length)];
            const line = this.generateCodeLine(pattern);
            this.terminal.textContent += line + "\n";
            
            // Auto-scroll to bottom
            this.terminal.scrollTop = this.terminal.scrollHeight;
            
            await this.delay(this.codeSpamSpeed);
        }
    }

    generateCodeLine(pattern) {
        return pattern
            .replace('{HEX}', Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0'))
            .replace('{ID}', Math.floor(Math.random() * 999).toString().padStart(3, '0'))
            .replace('{NUM}', Math.floor(Math.random() * 99))
            .replace('{STATE}', Math.random() > 0.5 ? 'CLEAR' : 'SCANNED')
            .replace('{LEVEL}', Math.floor(Math.random() * 100))
            .replace('{X}', (Math.random() * 2000 - 1000).toFixed(1))
            .replace('{Y}', (Math.random() * 2000 - 1000).toFixed(1))
            .replace('{CH}', Math.floor(Math.random() * 16))
            .replace('{STATUS}', Math.random() > 0.7 ? 'ACTIVE' : 'STANDBY')
            .replace('{METRIC}', ['O2', 'CO2', 'TEMP', 'PRESS'][Math.floor(Math.random() * 4)])
            .replace('{CONDITION}', ['OPTIMAL', 'NOMINAL', 'STABLE'][Math.floor(Math.random() * 3)])
            .replace('{RANGE}', Math.floor(Math.random() * 1000))
            .replace('{BYTES}', Math.floor(Math.random() * 9999));
    }

    async showAsciiArt() {
        const asciiArtText = `
  ██████╗ ██████╗  ██████╗      ██╗███████╗ ██████╗████████╗
  ██╔══██╗██╔══██╗██╔═══██╗     ██║██╔════╝██╔════╝╚══██╔══╝
  ██████╔╝██████╔╝██║   ██║     ██║█████╗  ██║        ██║   
  ██╔═══╝ ██╔══██╗██║   ██║██   ██║██╔══╝  ██║        ██║   
  ██║     ██║  ██║╚██████╔╝╚█████╔╝███████╗╚██████╗   ██║   
  ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚════╝ ╚══════╝ ╚═════╝   ╚═╝   
                                                             
            ██████╗ ██╗███████╗ ██████╗ ██████╗ ██╗   ██╗███████╗██████╗ ██╗   ██╗
            ██╔══██╗██║██╔════╝██╔════╝██╔═══██╗██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝
            ██║  ██║██║███████╗██║     ██║   ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝ 
            ██║  ██║██║╚════██║██║     ██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗  ╚██╔╝  
            ██████╔╝██║███████║╚██████╗╚██████╔╝ ╚████╔╝ ███████╗██║  ██║   ██║   
            ╚═════╝ ╚═╝╚══════╝ ╚═════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝   ╚═╝   
        `;

        // Gradually replace terminal content with ASCII art
        for (let i = 0; i < 30; i++) {
            const lines = this.terminal.textContent.split('\n');
            if (lines.length > 2) {
                lines.splice(1, 1); // Remove a line from the middle
                this.terminal.textContent = lines.join('\n');
            }
            await this.delay(50);
        }

        this.terminal.style.display = 'none';
        this.asciiArt.textContent = asciiArtText;
        this.asciiArt.classList.remove('hidden');
        
        await this.delay(1000);
    }

    showMenu() {
        this.menuOptions.classList.remove('hidden');
        this.isComplete = true;
        audioManager.startBackgroundMusic();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global intro instance
const introSequence = new IntroSequence();

