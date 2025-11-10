import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Where to output generated ABI/addresses in the frontend
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

// Resolve a deployments directory from a few likely repo layouts:
// 1) shield-trade-loop/deployments (preferred)
// 2) ../../fhevm-hardhat-template/deployments (repo root sibling)
// 3) ../fhevm-hardhat-template/deployments (monorepo under shield-trade-loop)
// 4) ../../packages/fhevm-hardhat-template/deployments (pnpm workspace style)
const line = "\n===================================================================\n";
const candidates = [
  path.resolve("../deployments"),
  path.resolve("../../fhevm-hardhat-template/deployments"),
  path.resolve("../fhevm-hardhat-template/deployments"),
  path.resolve("../../packages/fhevm-hardhat-template/deployments"),
];

let deploymentsDir = undefined;
let projectRoot = undefined;
for (const cand of candidates) {
  if (fs.existsSync(cand)) {
    deploymentsDir = cand;
    projectRoot = path.dirname(cand);
    break;
  }
}

if (!deploymentsDir) {
  console.error(
    `${line}Unable to locate a deployments directory. Looked at:\n${candidates
      .map((c) => ` - ${c}`)
      .join("\n")}\n\nEnsure you have deployed contracts (e.g., 'npx hardhat deploy --network localhost') in your Hardhat project.${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}
// if (!fs.existsSync(deploymentsDir)) {
//   console.error(
//     `${line}Unable to locate 'deployments' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
//   );
//   process.exit(1);
// }

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Script execution failed: ${e}${line}`);
    process.exit(1);
  }
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Try to auto-deploy the contract on hardhat node!
    deployOnHardhatNode();
  }

  if (!fs.existsSync(chainDeploymentDir)) {
    const hintRoot = projectRoot ? path.basename(projectRoot) : "<hardhat-project>";
    console.error(
      `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${hintRoot}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
    );
    if (!optional) {
      process.exit(1);
    }
    return undefined;
  }

  const contractJsonPath = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(contractJsonPath)) {
    const hintRoot = projectRoot ? path.basename(projectRoot) : "<hardhat-project>";
    if (!optional) {
      console.error(
        `${line}Missing ${contractName}.json in '${chainDeploymentDir}'.\n\n1. Goto '${hintRoot}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(contractJsonPath, "utf-8");

  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

function generateForContract(CONTRACT_NAME) {
  // Auto deployed on Linux/Mac (will fail on windows)
  const deployLocalhost = readDeployment(
    "localhost",
    31337,
    CONTRACT_NAME,
    false /* optional */
  );

  // Sepolia is optional
  let deploySepolia = readDeployment(
    "sepolia",
    11155111,
    CONTRACT_NAME,
    true /* optional */
  );
  if (!deploySepolia) {
    deploySepolia = {
      abi: deployLocalhost.abi,
      address: "0x0000000000000000000000000000000000000000",
    };
  }

  if (deployLocalhost && deploySepolia) {
    if (
      JSON.stringify(deployLocalhost.abi) !==
      JSON.stringify(deploySepolia.abi)
    ) {
      console.error(
        `${line}Deployments on localhost and Sepolia differ for ${CONTRACT_NAME}. Cant use the same abi on both networks. Consider re-deploying the contracts on both networks.${line}`
      );
      process.exit(1);
    }
  }

  const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify(
    { abi: deployLocalhost.abi },
    null,
    2
  )} as const;
\n`;
  const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
};
`;

  console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
  console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(
    path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
    tsAddresses,
    "utf-8"
  );
}

// Generate ShieldSwap contract ABI and addresses
generateForContract("ShieldSwap");
