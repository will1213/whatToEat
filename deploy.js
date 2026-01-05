import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const distFolder = 'dist';
const message = 'Deploying to GitHub Pages';
const repoUrl = 'git@github.com:will1213/whatToEat.git'; // Using your SSH remote
const branch = 'gh-pages';

try {

    // Checking out build folder and push it to gh-pages branch
    if (!fs.existsSync(distFolder)) {
        console.error(`❌ Error: ${distFolder} folder does not exist. Run "npm run build" first.`);
        process.exit(1);
    }

    const run = (command) => {
        console.log(`> ${command}`);
        execSync(command, { stdio: 'inherit', cwd: distFolder });
    };

    if (fs.existsSync(path.join(distFolder, '.git'))) {
        fs.rmSync(path.join(distFolder, '.git'), { recursive: true, force: true });
    }

    run('git init');
    run('git checkout -b ' + branch);
    run('git add -A');
    run(`git commit -m "${message}"`);
    run(`git push -f ${repoUrl} ${branch}`);

    console.log('Deployment complete!');
} catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
}
