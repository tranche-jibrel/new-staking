const LockupFactory = artifacts.require('LockupFactory');

const Token = artifacts.require('Token');
const LPToken = artifacts.require('LPToken');

const LPStaking = artifacts.require('LPStaking');


module.exports = async function (deployer) {
  // Deploy SLICE token
  await deployer.deploy(Token);
  const token = await Token.deployed();

  // Test LP Token
  await deployer.deploy(LPToken);
  const lpToken = await LPToken.deployed();

  // Staking Lockup Factory contract
  await deployer.deploy(LockupFactory, token.address);

  // LP Staking contract
  await deployer.deploy(LPStaking, lpToken.address, token.address)
};