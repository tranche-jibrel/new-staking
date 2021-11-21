const StakingFactory = artifacts.require('StakingFactory');

const Token = artifacts.require('Token');
const LPToken = artifacts.require('LPToken');

const LPFactory = artifacts.require('LPFactory');

module.exports = async function (deployer) {
  // Deploy SLICE token
  await deployer.deploy(Token, "Slice Test", "SLICE", '20000000', 0);
  const token = await Token.deployed();

  // Staking Lockup Factory contract
  await deployer.deploy(StakingFactory, token.address);
};