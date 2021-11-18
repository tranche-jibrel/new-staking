const LockupFactory = artifacts.require('LockupFactory');
const Token = artifacts.require('Token');
const StakingWithLockup = artifacts.require('LockupStaking');

const { time, expectRevert } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

contract("LockupStaking", accounts => {
    let token, factory;
    let initialBalance, pool1, pool2;
    let rewardRate = 10;
    let maxCapacity = web3.utils.toWei('1000');

    let owner = accounts[0];
    let testUser1 = accounts[1];
    let testUser2 = accounts[2];

    before(async() => {
        token = await Token.deployed();
        factory = await LockupFactory.deployed();
    })

    it("check token", async () => {
        let balance = await token.balanceOf(owner);

        expect(balance.toString()).to.equal(
            web3.utils.toWei('20000000'));
    })

    it("create new staking lockup", async () => {
        await factory.newStakingPool(
            30*24*60*60,   // stake duration
            maxCapacity,   // max tokens
            rewardRate     // reward rate
        )

        pool1 = await factory.stakingPools(0);
        expect(pool1).to.not.equal(0x0000000000000000000000000000000000000000);
    })

    it('fund staking pool', async () => {
        let totalReward = rewardRate*maxCapacity/100;
        await token.transfer(pool1, totalReward.toString(), { from : owner });

        expect((await token.balanceOf(pool1)).toString())
        .equal(totalReward.toString());
    })

    describe('modify lockup', () => {

        let newRewardRate, newMaxCapacity;

        before(async () => {
            pool1 = await factory.stakingPools(0);
            pool1 = await StakingWithLockup.at(pool1);

            rewardRate = await pool1.rewardRate();
            expect(rewardRate.toString()).to.equal('10');

            maxCapacity = await pool1.maxCapacity();
            expect(maxCapacity.toString()).to.equal(web3.utils.toWei('1000'))
        })

        it('owner should be able to update reward rate', async() => {
            let lockupOwner = await pool1.owner();
            expect(lockupOwner).to.equal(owner);
            
            newRewardRate = 20;
            await pool1.updateRewardRate(newRewardRate, {from: owner});

            rewardRate = await pool1.rewardRate();
            expect(rewardRate.toString()).to.equal(newRewardRate.toString());


            newRewardRate = 10;
            await pool1.updateRewardRate(newRewardRate, {from: owner});

            rewardRate = await pool1.rewardRate();
            expect(rewardRate.toString()).to.equal(newRewardRate.toString());
        })

        it('should throw error while updating reward rate from testUser1', async() => {            
            newRewardRate = 20;
            expectRevert(pool1.updateRewardRate(newRewardRate, {from: testUser1}), "Ownable: caller is not the owner");

            expect((await pool1.rewardRate()).toString()).to.not.equal(newRewardRate.toString());
        })

        it('owner should be able to update capacity', async() => {
            newMaxCapacity = web3.utils.toWei('2000');
            await pool1.updateMaxCapacity(newMaxCapacity, {from: owner});

            maxCapacity = await pool1.maxCapacity();
            expect(maxCapacity.toString()).to.equal(newMaxCapacity.toString());


            newMaxCapacity = web3.utils.toWei('1000');
            await pool1.updateMaxCapacity(newMaxCapacity, {from: owner});

            maxCapacity = await pool1.maxCapacity();
            expect(maxCapacity.toString()).to.equal(newMaxCapacity.toString());
        })

        it('should throw error while updating reward rate from testUser1', async() => {            
            newMaxCapacity = web3.utils.toWei('3000');
            expectRevert(pool1.updateMaxCapacity(newMaxCapacity, {from: testUser1}), "Ownable: caller is not the owner");

            expect((await pool1.maxCapacity()).toString()).to.not.equal(newMaxCapacity.toString());
        })
    })

    describe('staking', async () => {

        before(async () => {
            maxCapacity = await pool1.maxCapacity();
            expect(maxCapacity.toString()).to.equal(web3.utils.toWei('1000'))
            
            // use testUser1 to stake tokens
            await token.transfer(testUser1, web3.utils.toWei('10'), {from: owner});
        })

        it('should create 5 stakes', async () => {
            initialBalance = await token.balanceOf(testUser1);

            // approve 10 tokens
            await token.approve(pool1.address, web3.utils.toWei('5'), {from : testUser1});
            expect((await token.allowance(testUser1, pool1.address)).toString()).to.equal(web3.utils.toWei('5'));

            // stake 1 token * 10
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});

            expect((await pool1.stakeCounter(testUser1)).toString()).to.equal('5');

            expect(parseInt(await token.balanceOf(testUser1)))
            .to.equal(initialBalance - 5*(10**18))
        })

        it('should throw error staking > maxCapacity tokens', async () => {

            // approve maxCapacity tokens
            await token.approve(pool1.address, maxCapacity, {from: testUser1});
            expect((await token.allowance(testUser1, pool1.address)).toString()).to.equal(maxCapacity.toString());

            await expectRevert(pool1.stake(maxCapacity, {from: testUser1}), "Total deposits limit reached");
        })
    })

    describe('withdraw', () => {

        it('should throw error for premature withdrawal of stake1', async () => {
            initialBalance = await token.balanceOf(testUser1);
            expectRevert(pool1.withdraw(0, {from: testUser1}), "Lockup Period not over");

            expect(parseInt(await token.balanceOf(testUser1))).to.equal(parseInt(initialBalance));
        })


        it('should get 10% reward for withdrawal of stake2 after 31 days', async () => {
            await time.increase(time.duration.days(31));

            initialBalance = await token.balanceOf(testUser1);

            await pool1.withdraw(0, {from: testUser1});
            await pool1.withdraw(1, {from: testUser1});

            expect(parseInt(await token.balanceOf(testUser1)))
            .to.equal(parseInt(initialBalance) + 2*(10**18)*(1 + (rewardRate/100)))
        })

        it('should give more reward after updating rate' , async() => {

            // update reward rate
            newRewardRate = 20;
            await pool1.updateRewardRate(newRewardRate, {from: owner});

            rewardRate = await pool1.rewardRate();
            expect(rewardRate.toString()).to.equal(newRewardRate.toString());

            // withdraw
            initialBalance = await token.balanceOf(testUser1);

            await pool1.withdraw(2, {from: testUser1});

            expect(parseInt(await token.balanceOf(testUser1)))
            .to.equal(parseInt(initialBalance) + 1*(10**18)*(1 + (newRewardRate/100)))

        })

        it('should give less reward after updating rate' , async() => {
            // update reward rate
            newRewardRate = 2;
            await pool1.updateRewardRate(newRewardRate, {from: owner});

            rewardRate = await pool1.rewardRate();
            expect(rewardRate.toString()).to.equal(newRewardRate.toString());

            // withdraw
            initialBalance = await token.balanceOf(testUser1);

            await pool1.withdraw(3, {from: testUser1});

            expect(parseInt(await token.balanceOf(testUser1)))
            .to.equal(parseInt(initialBalance) + 1*(10**18)*(1 + (newRewardRate/100)))
        })
    });

    describe('full flow of lockup2', () => {

        it("create new staking lockup", async () => {
            maxCapacity = web3.utils.toWei('2000');
            rewardRate = 20;

            await factory.newStakingPool(
                60*24*60*60,   // stake duration
                maxCapacity,   // max tokens
                rewardRate     // reward rate
            )
    
            pool2 = await factory.stakingPools(1);
            expect(pool2).to.not.equal(0x0000000000000000000000000000000000000000);

            pool2 = await StakingWithLockup.at(pool2);

            await token.transfer(testUser2, web3.utils.toWei('100'), { from : owner });
        })
    
        it('fund staking pool', async () => {
            let totalReward = (rewardRate/100)*maxCapacity;
            await token.transfer(pool2.address, totalReward.toString(), { from : owner });
    
            expect((await token.balanceOf(pool2.address)).toString())
            .equal(totalReward.toString());
        })

        it('stake 100 tokens', async () => {
            initialBalance = await token.balanceOf(testUser2);

            // approve 100 tokens
            await token.approve(pool2.address, web3.utils.toWei('100'), {from: testUser2});
            expect((await token.allowance(testUser2, pool2.address, {from: testUser2})).toString()).to.equal(web3.utils.toWei('100'));

            console.log('Gas for staking 1st time', (await pool2.stake.estimateGas(web3.utils.toWei('50'), {from: testUser2})))
            await pool2.stake(web3.utils.toWei('50'), {from: testUser2});

            console.log('Gas for staking 2nd time', (await pool2.stake.estimateGas(web3.utils.toWei('50'), {from: testUser2})))
            await pool2.stake(web3.utils.toWei('50'), {from: testUser2});

            expect(parseInt(await token.balanceOf(testUser2)))
            .to.equal(initialBalance - 100*(10**18))
        })

        it('withdraw all stakes', async () => {
            await time.increase(time.duration.days(60));
            
            expect(parseInt(await token.balanceOf(testUser2))).to.equal(initialBalance - 100*(10**18))

            console.log('Gas for withdraw all', (await pool2.withdrawAll.estimateGas({from: testUser2})))
            await pool2.withdrawAll({from: testUser2});

            expect(parseInt(await token.balanceOf(testUser2))).to.equal(parseInt(initialBalance) + 100*(10**18)*(rewardRate/100))
        })
    });
})