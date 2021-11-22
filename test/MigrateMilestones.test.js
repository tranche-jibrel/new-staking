const LPFactory = artifacts.require('LPFactory');
const LPStaking = artifacts.require('LPStaking');

const StakingMilestones = artifacts.require('StakingMilestones');
const YieldFarm = artifacts.require('YieldFarm');
const Vault = artifacts.require('Vault');
const MigrateMilestones = artifacts.require('MigrateMilestones');
const Token = artifacts.require('Token');
const LPToken = artifacts.require('LPToken');

const { time, expectRevert, constants } = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS } = constants;
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { parse } = require("dotenv");
const timeMachine = require('ganache-time-traveler');

const fromWei = (x) => web3.utils.fromWei(x.toString());
const toWei = (x) => web3.utils.toWei(x.toString());

contract("MigrateMilestones", accounts => {
    let token, lp_token, factory;
    let newRewardRate;
    let initialBalance, pool1, pool2;
    let poolSize, poolBal1, poolBal2, poolBal3;

    let owner = accounts[0];
    let testUser1 = accounts[1];
    let testUser2 = accounts[2];
    let testUser3 = accounts[3];

    describe("setups", function () {
        it("retrieve deployed contracts", async function () {
          sliceContract = await Token.deployed();
          expect(sliceContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(sliceContract.address).to.match(/0x[0-9a-fA-F]{40}/);

          lpTokenContract = await LPToken.deployed();
          expect(lpTokenContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(lpTokenContract.address).to.match(/0x[0-9a-fA-F]{40}/);

          vaultContract = await Vault.deployed();
          expect(vaultContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(vaultContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    
          stkMilestonesContract = await StakingMilestones.deployed();
          expect(stkMilestonesContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(stkMilestonesContract.address).to.match(/0x[0-9a-fA-F]{40}/);

          yieldFarmContract = await YieldFarm.deployed();
          expect(yieldFarmContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(yieldFarmContract.address).to.match(/0x[0-9a-fA-F]{40}/);

          lpFactoryContract = await LPFactory.deployed();
          expect(lpFactoryContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(lpFactoryContract.address).to.match(/0x[0-9a-fA-F]{40}/); 
          
          migrateMSContract = await MigrateMilestones.deployed();
          expect(migrateMSContract.address).to.be.not.equal(ZERO_ADDRESS);
          expect(migrateMSContract.address).to.match(/0x[0-9a-fA-F]{40}/);
        });

        it("send some Slice to accounts", async function () {
            await sliceContract.transfer(testUser1, toWei("10000"))
            await sliceContract.transfer(testUser2, toWei("10000"))
            await sliceContract.transfer(testUser3, toWei("10000"))
        })

        it("send some LPToken to accounts", async function () {
            await lpTokenContract.mint(testUser1, toWei("1000"))
            await lpTokenContract.mint(testUser2, toWei("1000"))
            await lpTokenContract.mint(testUser3, toWei("1000"))
        })
    })

    describe("stake in old LP staking contract", function () {
        it("initialize epoch and stake LP token for users", async function () {
            
            await stkMilestonesContract.manualEpochInit([lpTokenContract.address], 0)
            currEpoch = await stkMilestonesContract.getCurrentEpoch()
            // console.log(currEpoch.toString())
            // res = await stkMilestonesContract.getEpochPoolSize(lpTokenContract.address, currEpoch)
            // console.log(res.toString())

            await lpTokenContract.approve(stkMilestonesContract.address, toWei("100"), {from: testUser1})
            await stkMilestonesContract.deposit(lpTokenContract.address, toWei("100"), {from: testUser1})
            // res = await stkMilestonesContract.getEpochPoolSize(lpTokenContract.address, currEpoch)
            // console.log(res.toString())

            await lpTokenContract.approve(stkMilestonesContract.address, toWei("100"), {from: testUser2})
            await stkMilestonesContract.deposit(lpTokenContract.address, toWei("100"), {from: testUser2})
            // res = await stkMilestonesContract.getEpochPoolSize(lpTokenContract.address, currEpoch)
            // console.log(res.toString())

            await lpTokenContract.approve(stkMilestonesContract.address, toWei("100"), {from: testUser3})
            await stkMilestonesContract.deposit(lpTokenContract.address, toWei("100"), {from: testUser3})
            poolSize = await stkMilestonesContract.getEpochPoolSize(lpTokenContract.address, currEpoch)
            console.log(`StkMilestones pool size: ${fromWei(poolSize.toString())}`)

            poolBal1 = await stkMilestonesContract.getEpochUserBalance(testUser1, lpTokenContract.address, currEpoch)
            console.log(`testUser1 pool balance: ${fromWei(poolBal1.toString())}`)
            poolBal2 = await stkMilestonesContract.getEpochUserBalance(testUser2, lpTokenContract.address, currEpoch)
            console.log(`testUser2 pool balance: ${fromWei(poolBal2.toString())}`)
            poolBal3 = await stkMilestonesContract.getEpochUserBalance(testUser3, lpTokenContract.address, currEpoch)
            console.log(`testUser3 pool balance: ${fromWei(poolBal3.toString())}`)
        })
    })

    describe("withdraw at the end of current epoch", function () {
        it("waiting for current epoch to end", async function () {
            let block = await web3.eth.getBlockNumber();
            console.log("Actual Block: " + block + ", time: " + (await web3.eth.getBlock(block)).timestamp);
            const maturity = Number(time.duration.seconds(86401));
            await timeMachine.advanceTimeAndBlock(maturity);
            block = await web3.eth.getBlockNumber()
            console.log("New Actual Block: " + block + ", new time: " + (await web3.eth.getBlock(block)).timestamp)
        })

        it("users withdraws", async function () {
            await stkMilestonesContract.withdraw(lpTokenContract.address, poolBal1, {from: testUser1})
            res = await lpTokenContract.balanceOf(testUser1)
            console.log(`testUser1 lpToken balance: ${fromWei(res.toString())}`)
            res = await sliceContract.balanceOf(testUser1)
            console.log(`testUser1 slice balance: ${fromWei(res.toString())}`)
        })
    })

})