const LockupFactory = artifacts.require('LockupFactory');
const Token = artifacts.require('Token');
const LockupStaking = artifacts.require('LockupStaking');
const OldStakingWithLockup = artifacts.require('StakingWithLockup');
const MigrateStaking = artifacts.require('MigrateStaking');
const Vault = artifacts.require('Vault');

const { BN, time, expectRevert, constants } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { ZERO_ADDRESS } = constants;
const { expect } = require("chai");
const timeMachine = require('ganache-time-traveler');

const fromWei = (x) => web3.utils.fromWei(x.toString());
const toWei = (x) => web3.utils.toWei(x.toString());

contract("MigrateStaking", accounts => {
    let factory;
    let initialBalance, pool1, pool2, pool3;
    let pool1Contract, pool2Contract, pool3Contract;
    let duration1 = 30*24*60*60;
    let duration2 = 60*24*60*60;
    let duration3 = 90*24*60*60;
    let maxCapacity1 = toWei('1000');
    let maxCapacity2 = toWei('2000');
    let maxCapacity3 = toWei('4000');
    let rewardRate1 = web3.utils.toWei("0.1");
    let rewardRate2 = web3.utils.toWei("0.15");
    let rewardRate3 = web3.utils.toWei("0.2");

    let owner = accounts[0];
    let testUser1 = accounts[1];
    let testUser2 = accounts[2];

    describe("setups", function () {
        it("retrieve deployed contracts", async function () {
          sliceContract = await Token.deployed();
          expect(sliceContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(sliceContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    
          vaultContract = await Vault.deployed();
          expect(vaultContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(vaultContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    
          stkLckpContract = await OldStakingWithLockup.deployed();
          expect(stkLckpContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(stkLckpContract.address).to.match(/0x[0-9a-fA-F]{40}/);

          lockupFactoryContract = await LockupFactory.deployed();
          expect(lockupFactoryContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(lockupFactoryContract.address).to.match(/0x[0-9a-fA-F]{40}/); 
          
          migratingContract = await MigrateStaking.deployed();
          expect(migratingContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(migratingContract.address).to.match(/0x[0-9a-fA-F]{40}/);

          factory = await LockupFactory.deployed();
          expect(migratingContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(migratingContract.address).to.match(/0x[0-9a-fA-F]{40}/);
        });
    
        it("Should initialize", async function () {
          const vault = await stkLckpContract._vault();
          expect(vault).to.be.equal(vaultContract.address);
    
          const slice = await stkLckpContract._slice();
          expect(slice).to.be.equal(sliceContract.address);
    
          const stakeToken = await stkLckpContract._stakableToken();
          expect(stakeToken).to.be.equal(sliceContract.address);
    
          const name = await stkLckpContract.name();
          expect(name).to.be.equal("Stake Token");
    
          const symbol = await stkLckpContract.symbol();
          expect(symbol).to.be.equal("STK");
    
          const numDurations = await stkLckpContract.numDurations();
          expect(numDurations).to.be.bignumber.equal(new BN("5"));
    
          const duration = await stkLckpContract.durations(0);
          expect(duration).to.be.bignumber.equal(new BN("10")); // 7 days = 7*24*60*60 seconds = 604800
        });

        it("Send some Slice to accounts", async function () {
            await sliceContract.transfer(testUser1, toWei("10000"))
            await sliceContract.transfer(testUser2, toWei("10000"))
        })
    });

    describe("stake()", function () {
        it("Should stake for user1 in index 0", async function () {
            await sliceContract.approve(stkLckpContract.address, toWei("1000"), { from: testUser1 });
       
            await stkLckpContract.stake(toWei("1000"), 0, { from: testUser1 });
       
            const balance = await sliceContract.balanceOf(stkLckpContract.address);
            expect(balance).to.be.bignumber.equal(toWei("1000"));
       
            const stakeTokenBalance = await stkLckpContract.balanceOf(testUser1);
            expect(stakeTokenBalance).to.be.bignumber.equal(toWei("1100")); // Stake Token minted = amount staked + reward calculated
       
            var result = await stkLckpContract.stakingDetails(testUser1, 1);
       
            expect(result.amount).to.be.bignumber.equal(toWei("1000"));
            expect(result.reward).to.be.bignumber.equal(toWei("100"));
        });
    
        it("Should stake for user2 in index 1", async function () {
            await sliceContract.approve(stkLckpContract.address, toWei("1000"), { from: testUser2 });
    
            await stkLckpContract.stake(toWei("1000"), 1, { from: testUser2 });
    
            const balance = await sliceContract.balanceOf(stkLckpContract.address);
            expect(balance).to.be.bignumber.equal(toWei("2000"));
    
            var result = await stkLckpContract.stakingDetails(testUser2, 1);
    
            expect(result.amount).to.be.bignumber.equal(toWei("1000"));
            expect(result.reward).to.be.bignumber.equal(toWei("200"));
        });

        it("Should stake for user1 in index 2", async function () {
            await sliceContract.approve(stkLckpContract.address, toWei("1500"), { from: testUser1 });
       
            await stkLckpContract.stake(toWei("1500"), 2, { from: testUser1 });
       
            const balance = await sliceContract.balanceOf(stkLckpContract.address);
            expect(balance).to.be.bignumber.equal(toWei("3500"));
       
            const stakeTokenBalance = await stkLckpContract.balanceOf(testUser1);
            expect(stakeTokenBalance).to.be.bignumber.equal(toWei("3050")); // Stake Token minted = amount staked + reward calculated
       
            var result = await stkLckpContract.stakingDetails(testUser1, 2);
       
            expect(result.amount).to.be.bignumber.equal(toWei("1500"));
            expect(result.reward).to.be.bignumber.equal(toWei("450"));
        });

        it("Should stake for user2 in index 2", async function () {
            await sliceContract.approve(stkLckpContract.address, toWei("2000"), { from: testUser2 });
    
            await stkLckpContract.stake(toWei("2000"), 2, { from: testUser2 });
    
            const balance = await sliceContract.balanceOf(stkLckpContract.address);
            expect(balance).to.be.bignumber.equal(toWei("5500"));
    
            var result = await stkLckpContract.stakingDetails(testUser2, 2);
    
            expect(result.amount).to.be.bignumber.equal(toWei("2000"));
            expect(result.reward).to.be.bignumber.equal(toWei("600"));
        });
    })

    describe("Deploy new staking contracts", function() {
        it("create staking lockup #0", async () => {
            await factory.newStakingPool(duration1, maxCapacity1, rewardRate1)
    
            pool1 = await factory.stakingPools(0);
            expect(pool1).to.not.equal(ZERO_ADDRESS);
            expect(pool1).to.match(/0x[0-9a-fA-F]{40}/);

            pool1Contract = await LockupStaking.at(pool1)
            await pool1Contract.setMigrateStaking(migratingContract.address)
            expect(await pool1Contract.migrationStakingAddress()).equal(migratingContract.address)
        })
    
        it('fund staking pool #0', async () => {
            let totalReward = rewardRate1 * maxCapacity1 / (10**18);
            await sliceContract.transfer(pool1, totalReward.toString(), { from : owner });
    
            expect((await sliceContract.balanceOf(pool1)).toString()).equal(totalReward.toString());
        })

        it("create staking lockup #1", async () => {
            await factory.newStakingPool(duration2, maxCapacity2, rewardRate2)
    
            pool2 = await factory.stakingPools(1);
            expect(pool2).to.not.equal(ZERO_ADDRESS);
            expect(pool2).to.match(/0x[0-9a-fA-F]{40}/);

            pool2Contract = await LockupStaking.at(pool2)
            await pool2Contract.setMigrateStaking(migratingContract.address)
            expect(await pool2Contract.migrationStakingAddress()).equal(migratingContract.address)
        })
    
        it('fund staking pool #1', async () => {
            let totalReward = rewardRate2 * maxCapacity2 / (10**18);
            await sliceContract.transfer(pool2, totalReward.toString(), { from : owner });
    
            expect((await sliceContract.balanceOf(pool2)).toString()).equal(totalReward.toString());
        })

        it("create staking lockup #2", async () => {
            await factory.newStakingPool(duration3, maxCapacity3, rewardRate3)
    
            pool3 = await factory.stakingPools(2);
            expect(pool3).to.not.equal(ZERO_ADDRESS);
            expect(pool3).to.match(/0x[0-9a-fA-F]{40}/);

            pool3Contract = await LockupStaking.at(pool3)
            await pool3Contract.setMigrateStaking(migratingContract.address)
            expect(await pool3Contract.migrationStakingAddress()).equal(migratingContract.address)
        })
    
        it('fund staking pool #2', async () => {
            let totalReward = rewardRate3 * maxCapacity3 / (10**18);
            await sliceContract.transfer(pool3, totalReward.toString(), { from : owner });
    
            expect((await sliceContract.balanceOf(pool3)).toString()).equal(totalReward.toString());
        })
    })

    describe("Migrate old contract to new contract", function() {
        let durIdx;

        it("get parameters from old staking contract", async () => {
            res1 = await stkLckpContract.stakeCounter(testUser1);
            for (let i = 1; i <= res1; i++) {
                res2 = await stkLckpContract.stakingDetails(testUser1, i);
                console.log("testUser1 staking details in old staking: counter: " + res1 + ", startTime: " + res2[0] + ", amount: " + fromWei(res2[1]) + ", durationIndex: " + res2[4])
            }

            res1 = await stkLckpContract.stakeCounter(testUser2);
            for (let i = 1; i <= res1; i++) {
                res2 = await stkLckpContract.stakingDetails(testUser2, i);
                console.log("testUser2 staking details in old staking: counter: " + res1 + ", startTime: " + res2[0] + ", amount: " + fromWei(res2[1]) + ", durationIndex: " + res2[4])
            }
        })

        it("migrate to staking lockup #0", async () => {
            durIdx = 0;
            bal = await sliceContract.balanceOf(pool1Contract.address)
            console.log("Pool1 balance: " + fromWei(bal))
            await migratingContract.migrateSingleStakingDetail(testUser1, 0, pool1)
            res1 = await pool1Contract.stakeCounter(testUser1)
            for (let i = 0; i <= res1; i++) {
                res2 = await pool1Contract.stakingDetails(testUser1, i)
                console.log("testUser1 staking details in new staking #0: counter: " + res1 + ", startTime: " + res2[0] + ", amount: " + fromWei(res2[1]))
            }

            await migratingContract.migrateSingleStakingDetail(testUser2, 0, pool1)
            res1 = await pool1Contract.stakeCounter(testUser2)
            for (let i = 0; i <= res1; i++) {
                res2 = await pool1Contract.stakingDetails(testUser2, i)
                console.log("testUser2 staking details in new staking #0: counter: " + res1 + ", startTime: " + res2[0] + ", amount: " + fromWei(res2[1]))
            }
            // amount2transfer = await stkLckpContract.totalTokensStakedInDuration(durIdx)
            // console.log(amount2transfer.toString())
            amount2transfer = await stkLckpContract.tokensStakedInDuration(durIdx)
            // console.log(amount2transfer.toString())
            await stkLckpContract.repeal(durIdx)
            await sliceContract.transfer(pool1Contract.address, amount2transfer)
            bal = await sliceContract.balanceOf(pool1Contract.address)
            console.log("Pool1 new balance: " + fromWei(bal))

            // amountLeft = await stkLckpContract.tokensStakedInDuration(durIdx)
            // console.log("Amount left in old duration 0: " + amountLeft)
        })

        it("migrate to staking lockup #1", async () => {
            durIdx = 1;
            bal = await sliceContract.balanceOf(pool2Contract.address)
            console.log("Pool2 balance: " + fromWei(bal))
            await migratingContract.migrateSingleStakingDetail(testUser1, 1, pool2)
            res1 = await pool2Contract.stakeCounter(testUser1)
            for (let i = 0; i <= res1; i++) {
                res2 = await pool2Contract.stakingDetails(testUser1, i)
                console.log("testUser1 staking details in new staking #0: counter: " + res1 + ", startTime: " + res2[0] + ", amount: " + fromWei(res2[1]))
            }

            await migratingContract.migrateSingleStakingDetail(testUser2, 1, pool2)
            res1 = await pool2Contract.stakeCounter(testUser2)
            for (let i = 0; i <= res1; i++) {
                res2 = await pool2Contract.stakingDetails(testUser2, i)
                console.log("testUser2 staking details in new staking #0: counter: " + res1 + ", startTime: " + res2[0] + ", amount: " + fromWei(res2[1]))
            }
            amount2transfer = await stkLckpContract.tokensStakedInDuration(durIdx)
            await stkLckpContract.repeal(durIdx)
            await sliceContract.transfer(pool2Contract.address, amount2transfer)
            bal = await sliceContract.balanceOf(pool2Contract.address)
            console.log("Pool2 new balance: " + fromWei(bal))

            // amountLeft = await stkLckpContract.tokensStakedInDuration(durIdx)
            // console.log("Amount left in old duration 1: " + amountLeft)
        })

        it("migrate to staking lockup #2", async () => {
            durIdx = 2;
            bal = await sliceContract.balanceOf(pool3Contract.address)
            console.log("Pool3 balance: " + fromWei(bal))
            await migratingContract.migrateSingleStakingDetail(testUser1, 2, pool3)
            res1 = await pool3Contract.stakeCounter(testUser1)
            for (let i = 0; i <= res1; i++) {
                res2 = await pool3Contract.stakingDetails(testUser1, i)
                console.log("testUser1 staking details in new staking #0: counter: " + res1 + ", startTime: " + res2[0] + ", amount: " + fromWei(res2[1]))
            }

            await migratingContract.migrateSingleStakingDetail(testUser2, 2, pool3)
            res1 = await pool3Contract.stakeCounter(testUser2)
            for (let i = 0; i <= res1; i++) {
                res2 = await pool3Contract.stakingDetails(testUser2, i)
                console.log("testUser2 staking details in new staking #0: counter: " + res1 + ", startTime: " + res2[0] + ", amount: " + fromWei(res2[1]))
            }
            amount2transfer = await stkLckpContract.tokensStakedInDuration(durIdx)
            await stkLckpContract.repeal(durIdx)
            await sliceContract.transfer(pool3Contract.address, amount2transfer)
            bal = await sliceContract.balanceOf(pool3Contract.address)
            console.log("Pool3 new balance: " + fromWei(bal))

            amountLeft = await sliceContract.balanceOf(stkLckpContract.address)
            console.log("Amount left in old contract: " + amountLeft)
        })
    })

    describe('withdraw from pool #1', () => {
        it('should throw error for premature withdrawal of pool #1', async () => {
            initialBalance = await sliceContract.balanceOf(testUser1);
            await expectRevert(pool1Contract.withdraw(0, {from: testUser1}), "Lockup Period not over");

            expect(parseInt(await sliceContract.balanceOf(testUser1))).to.equal(parseInt(initialBalance));
        })

        it('should get 10% reward for withdrawal of stake2 after 31 days', async () => {
            let block = await web3.eth.getBlockNumber();
            console.log("Actual Block: " + block + ", time: " + (await web3.eth.getBlock(block)).timestamp);
            const maturity = Number(time.duration.days(31));
            await timeMachine.advanceTimeAndBlock(maturity);
            block = await web3.eth.getBlockNumber()
            console.log("New Actual Block: " + block + ", new time: " + (await web3.eth.getBlock(block)).timestamp)

            initialBalance = await sliceContract.balanceOf(testUser1);
            res = await pool1Contract.stakingDetails(testUser1, 0);
            // console.log(res[0].toString(), res[1].toString())
            perc = rewardRate1 / (10**18)
            console.log("Percent return pool1: " + perc.toString())
            var amount = web3.utils.toBN(res[1].toString())
            var rewards = web3.utils.toBN((amount * perc).toString())
            console.log("testUser1 Rewards amount: " + fromWei(rewards.toString()))

            await pool1Contract.withdraw(0, {from: testUser1});
   
            newBalance = await sliceContract.balanceOf(testUser1);
            console.log("testUser1 new Balance: " + fromWei(newBalance).toString())

            newBalance = await sliceContract.balanceOf(pool1);
            console.log("Pool1 new balance: " + fromWei(newBalance).toString())

            newBal = initialBalance.add(amount).add(rewards)
            // console.log(fromWei(newBal.toString()))
            expect(fromWei(await sliceContract.balanceOf(testUser1)).toString()).to.equal(fromWei(newBal.toString()).toString())
        })
    });

    describe('withdraw from pool #2', () => {
        it('should throw error for premature withdrawal of pool #2', async () => {
            initialBalance = await sliceContract.balanceOf(testUser2);
            await expectRevert(pool2Contract.withdraw(0, {from: testUser2}), "Lockup Period not over");

            expect(parseInt(await sliceContract.balanceOf(testUser2))).to.equal(parseInt(initialBalance));
        })

        it('should get 15% reward for withdrawal of pool #2 after another 30 days', async () => {
            let block = await web3.eth.getBlockNumber();
            console.log("Actual Block: " + block + ", time: " + (await web3.eth.getBlock(block)).timestamp);
            const maturity = Number(time.duration.days(30));
            await timeMachine.advanceTimeAndBlock(maturity);
            block = await web3.eth.getBlockNumber()
            console.log("New Actual Block: " + block + ", new time: " + (await web3.eth.getBlock(block)).timestamp)

            initialBalance = await sliceContract.balanceOf(testUser2);
            console.log("testUser2 starting Balance: " + fromWei(initialBalance).toString())

            res = await pool2Contract.stakingDetails(testUser2, 0);
            // console.log(res[0].toString(), res[1].toString())
            perc = rewardRate2 / (10**18)
            console.log("Percent return pool2: " + perc.toString())
            var amount = web3.utils.toBN(res[1].toString())
            var rewards = web3.utils.toBN((amount * perc).toString())
            console.log("testUser2 Rewards amount: " + fromWei(rewards.toString()))

            await pool2Contract.withdraw(0, {from: testUser2});
   
            newBalance = await sliceContract.balanceOf(testUser2);
            console.log("testUser2 new Balance: " + fromWei(newBalance).toString())

            newBalance = await sliceContract.balanceOf(pool2);
            console.log("Pool2 new balance: " + fromWei(newBalance).toString())
            
            // newBal = +initialBalance + +amount + +rewards
            newBal = initialBalance.add(amount).add(rewards)
            // console.log(fromWei(newBal.toString()))
            expect(fromWei(await sliceContract.balanceOf(testUser2)).toString()).to.equal(fromWei(newBal.toString()).toString())
        })
    });

    describe('withdraw from pool #3', () => {
        it('should throw error for premature withdrawal of pool #3', async () => {
            initialBalance = await sliceContract.balanceOf(testUser2);
            await expectRevert(pool3Contract.withdraw(0, {from: testUser2}), "Lockup Period not over");

            expect(parseInt(await sliceContract.balanceOf(testUser2))).to.equal(parseInt(initialBalance));
        })

        it('should get 20% reward for withdrawal of pool #3 after another 30 days', async () => {
            let block = await web3.eth.getBlockNumber();
            console.log("Actual Block: " + block + ", time: " + (await web3.eth.getBlock(block)).timestamp);
            const maturity = Number(time.duration.days(30));
            await timeMachine.advanceTimeAndBlock(maturity);
            block = await web3.eth.getBlockNumber()
            console.log("New Actual Block: " + block + ", new time: " + (await web3.eth.getBlock(block)).timestamp)

            initialBalance1 = await sliceContract.balanceOf(testUser1);
            console.log("testUser1 starting Balance: " + fromWei(initialBalance1).toString())
            initialBalance2 = await sliceContract.balanceOf(testUser2);
            console.log("testUser2 starting Balance: " + fromWei(initialBalance2).toString())

            res = await pool3Contract.stakingDetails(testUser1, 0);
            // console.log(res[0].toString(), res[1].toString())
            perc = rewardRate3 / (10**18)
            console.log("Percent return pool3: " + perc.toString())
            var amount1 = web3.utils.toBN(res[1].toString())
            var rewards1 = web3.utils.toBN((amount1 * perc).toString())
            console.log("testUser1 Rewards amount: " + fromWei(rewards1.toString()))

            res = await pool3Contract.stakingDetails(testUser2, 0);
            // console.log(res[0].toString(), res[1].toString())
            var amount2 = web3.utils.toBN(res[1].toString())
            var rewards2 = web3.utils.toBN((amount2 * perc).toString())
            console.log("testUser2 Rewards amount: " + fromWei(rewards2.toString()))

            await pool3Contract.withdraw(0, {from: testUser1});
            await pool3Contract.withdraw(0, {from: testUser2});
   
            newBalance1 = await sliceContract.balanceOf(testUser1);
            console.log("testUser1 new Balance: " + fromWei(newBalance1).toString())
            newBalance2 = await sliceContract.balanceOf(testUser2);
            console.log("testUser2 new Balance: " + fromWei(newBalance2).toString())

            newBalance = await sliceContract.balanceOf(pool3);
            console.log("Pool3 new balance: " + fromWei(newBalance).toString())
            
            newBal1 = initialBalance1.add(amount1).add(rewards1)
            newBal2 = initialBalance2.add(amount2).add(rewards2)
            // console.log(fromWei(newBal1.toString()))
            // console.log(fromWei(newBal2.toString()))
            expect(fromWei(await sliceContract.balanceOf(testUser1)).toString()).to.equal(fromWei(newBal1.toString()).toString())
            expect(fromWei(await sliceContract.balanceOf(testUser2)).toString()).to.equal(fromWei(newBal2.toString()).toString())
        })
    });

})