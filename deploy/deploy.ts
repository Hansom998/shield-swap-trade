import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log(`Deploying ShieldSwap with account: ${deployer}`);
  console.log(`Network: ${hre.network.name}`);

  const deployedShieldSwap = await deploy("ShieldSwap", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
    waitConfirmations: hre.network.name === "sepolia" ? 2 : 1,
  });

  console.log(`ShieldSwap contract deployed at: ${deployedShieldSwap.address}`);
  console.log(`Transaction hash: ${deployedShieldSwap.transactionHash}`);
  
  if (deployedShieldSwap.newlyDeployed) {
    console.log(`✅ ShieldSwap successfully deployed!`);
  } else {
    console.log(`♻️  ShieldSwap already deployed, skipping...`);
  }
};
export default func;
func.id = "deploy_shieldSwap";
func.tags = ["ShieldSwap"];
