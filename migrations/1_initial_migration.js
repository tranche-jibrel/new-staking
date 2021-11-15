const LockupFactory = artifacts.require('LockupFactory');

const Token = artifacts.require('Token');
const LPToken = artifacts.require('LPToken');

const LPFactory = artifacts.require('LPFactory');

module.exports = async function (deployer) {
  // Deploy SLICE token
  await deployer.deploy(Token, "Slice Test", "SLICE", '1000000000000000000000000000', 0);
  const token = await Token.deployed();

  // Staking Lockup Factory contract
  await deployer.deploy(LockupFactory, token.address);

  // LP Staking factory contract
  await deployer.deploy(LPFactory, token.address)
};