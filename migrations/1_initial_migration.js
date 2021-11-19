require('dotenv').config();

const LockupFactory = artifacts.require('LockupFactory');
const LPFactory = artifacts.require('LPFactory');
const Token = artifacts.require('Token');
// const LPToken = artifacts.require('LPToken');
const StakingWithLockup = artifacts.require('StakingWithLockup');
const MigrateStaking = artifacts.require('MigrateStaking');
const Vault = artifacts.require('Vault');

const totalReward = "10000";

module.exports = async function (deployer, network, accounts) {
  if (network == "development") {
    
    await deployer.deploy(Token, "Slice Token", "SLICE", 20000000, 0);
    const mySliceInstance = await Token.deployed();
    console.log(`Slice Deployed: ${mySliceInstance.address}`);

    await deployer.deploy(Vault, mySliceInstance.address);
    const vaultInstance = await Vault.deployed();
    console.log(`Vault deployed: ${vaultInstance.address}`)

    await deployer.deploy(StakingWithLockup, vaultInstance.address, mySliceInstance.address, mySliceInstance.address,
      [web3.utils.toWei("0.1"), web3.utils.toWei("0.2"), web3.utils.toWei("0.3"), web3.utils.toWei("0.4"), web3.utils.toWei("0.5")],
      [web3.utils.toWei("1000"), web3.utils.toWei("2000"), web3.utils.toWei("3000"), web3.utils.toWei("4000"), web3.utils.toWei("5000")],
      [10, 20, 30, 40, 50],
      "Stake Token",
      "STK");
    const stakingLockupInstance = await StakingWithLockup.deployed();
    console.log(`Staking with lockup deployed: ${stakingLockupInstance.address}`);

    await vaultInstance.setAllowance(stakingLockupInstance.address, web3.utils.toWei(totalReward));

    await mySliceInstance.transfer(vaultInstance.address, web3.utils.toWei(totalReward));

    await deployer.deploy(MigrateStaking, mySliceInstance.address, stakingLockupInstance.address);
    const myMigratingContract = await MigrateStaking.deployed();
    console.log(`Migrating contract deployed: ${myMigratingContract.address}`)

    // Staking Lockup Factory contract
    await deployer.deploy(LockupFactory, mySliceInstance.address);
    const myLockupFactory = await LockupFactory.deployed();
    console.log(`LockupFactory deployed: ${myLockupFactory.address}`)

    // LP Staking factory contract
    await deployer.deploy(LPFactory, mySliceInstance.address)
    const myLPFactory = await LPFactory.deployed();
    console.log(`LPFactory deployed: ${myLPFactory.address}`)
  }
};