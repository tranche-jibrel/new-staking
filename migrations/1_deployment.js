const StakingRewards = artifacts.require("StakingRewards");
const SliceToken = artifacts.require("ERC20");

module.exports = async function (deployer) {
  await deployer.deploy(SliceToken, "Tranche", "SLICE");
  const slice = await SliceToken.deployed();

  await deployer.deploy(StakingRewards, slice.address);
};