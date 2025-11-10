import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedShieldSwap = await deploy("ShieldSwap", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
  });

  console.log(`ShieldSwap contract: `, deployedShieldSwap.address);
};
export default func;
func.id = "deploy_shieldSwap";
func.tags = ["ShieldSwap"];
