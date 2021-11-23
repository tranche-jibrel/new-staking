const StakingFactory = artifacts.require('StakingFactory');
const Token = artifacts.require('Token');

module.exports = async function (deployer) {
  // Deploy Test token
  await deployer.deploy(Token, "Test Token", "TEST", '1000000000', 0);
  const token = await Token.deployed();

  // Staking Lockup Factory contract
  await deployer.deploy(StakingFactory, token.address);
};