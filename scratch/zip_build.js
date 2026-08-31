const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = 'C:\\Users\\ETicaret\\Desktop\\PEKEFE\\webtasarim\\pekefe-app';
const zipPath = path.join(projectDir, 'pekefe_cpanel_deploy.zip');
const stageDir = path.join(projectDir, 'cpanel_deploy_staging');

function runRobocopy(src, dest, extraArgs = "") {
  try {
    execSync(`robocopy "${src}" "${dest}" /E /XF *.map ${extraArgs}`, { stdio: 'ignore' });
  } catch (e) {
    // Robocopy returns exit codes 1-7 for successful copy operations
    if (e.status > 7) {
      console.error(`Robocopy failed with exit code ${e.status} for ${src}`);
    }
  }
}

console.log('Cleaning staging and zip...');
if (fs.existsSync(zipPath)) {
  try { fs.unlinkSync(zipPath); } catch {}
}
if (fs.existsSync(stageDir)) {
  try { fs.rmSync(stageDir, { recursive: true, force: true }); } catch {}
}

fs.mkdirSync(stageDir, { recursive: true });

console.log('Copying standalone build files...');
runRobocopy(path.join(projectDir, '.next', 'standalone'), stageDir);

console.log('Copying static assets...');
runRobocopy(path.join(projectDir, '.next', 'static'), path.join(stageDir, '.next', 'static'));

console.log('Copying public files...');
runRobocopy(path.join(projectDir, 'public'), path.join(stageDir, 'public'));

console.log('Copying prisma files...');
runRobocopy(path.join(projectDir, 'prisma'), path.join(stageDir, 'prisma'));

fs.copyFileSync(path.join(projectDir, 'cpanel_server.js'), path.join(stageDir, 'cpanel_server.js'));
fs.copyFileSync(path.join(projectDir, 'package.json'), path.join(stageDir, 'package.json'));
fs.copyFileSync(path.join(projectDir, '.env'), path.join(stageDir, '.env'));

console.log('Zipping staging directory using PowerShell .NET ZipFile...');
const psScript = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = '${zipPath.replace(/\\/g, '/')}'
$stageDir = '${stageDir.replace(/\\/g, '/')}'
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($stageDir, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
`;

execSync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });

console.log('Cleaning staging directory...');
try { fs.rmSync(stageDir, { recursive: true, force: true }); } catch {}

const stats = fs.statSync(zipPath);
console.log(`SUCCESS! Zip file created: ${zipPath}`);
console.log(`Zip Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
