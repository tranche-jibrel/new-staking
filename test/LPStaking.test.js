const LPFactory = artifacts.require('LPFactory');
const LPStaking = artifacts.require('LPStaking');

const Token = artifacts.require('Token');
const LPToken = artifacts.require('LPToken');

const { time, expectRevert } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { parse } = require("dotenv");

contract("LPStaking", accounts => {
    let token, lp_token, factory;
    let newRewardRate;
    let initialBalance, pool1, pool2;

    let owner = accounts[0];
    let testUser1 = accounts[1];
    let testUser2 = accounts[2];
    let testUser3 = accounts[3];

    before(async() => {
        token = await Token.deployed();
        lp_token = await LPToken.new();

        factory = await LPFactory.deployed();
    })

    it("check token", async () => {
        let balance = await token.balanceOf(owner);

        expect(balance.toString()).to.equal(
            web3.utils.toWei('1000000000000000000000000000'));
    })
    
    it('new lp staking pool - 1', async () => {
        await factory.newStakingPool(lp_token.address, 100);
        pool1 = await LPStaking.at(await factory.stakingPools(0));
        expect(pool1.address).to.not.equal(0x0000000000000000000000000000000000000000);

        // fund the staking pool
        await token.transfer(pool1.address, web3.utils.toWei('1000000'));
    })

    describe('stake & withdraw', async() => {
        before(async() => {
            await lp_token.mint(testUser1, web3.utils.toWei('100'));
            await lp_token.mint(testUser2, web3.utils.toWei('80'));
            await lp_token.mint(testUser3, web3.utils.toWei('20'));
        })

        it('user1 should be able to stake 50+50 tokens', async () => {

            await lp_token.approve(pool1.address, web3.utils.toWei('1000'), {from: testUser1});

            console.log("Gas for LP staking 1st time: ", (await pool1.stake.estimateGas(web3.utils.toWei('50'), {from: testUser1})))
            await pool1.stake(web3.utils.toWei('50'), {from: testUser1});

            console.log("Gas for LP staking 2st time: ", (await pool1.stake.estimateGas(web3.utils.toWei('50'), {from: testUser1})))
            await pool1.stake(web3.utils.toWei('50'), {from: testUser1});

            expect((await pool1.balanceOf(testUser1)).toString()).to.equal(web3.utils.toWei('100'));
            expect((await lp_token.balanceOf(testUser1)).toString()).to.equal(web3.utils.toWei('0'));
        })

        it('should be able to withdraw + rewards after 1000 sec', async() => {
            // initial token balance is 0
            expect(parseInt(await token.balanceOf(testUser1))).to.equal(0);

            await time.increase(1000);

            console.log("Gas for exit stake: ", (await pool1.exit.estimateGas({from: testUser1})))
            await pool1.exit({from: testUser1});

            expect((await pool1.balanceOf(testUser1)).toString()).to.equal(web3.utils.toWei('0'));
            expect(parseInt(await token.balanceOf(testUser1))).to.be.closeTo(100*1000, 200);
            expect((await lp_token.balanceOf(testUser1)).toString()).to.equal(web3.utils.toWei('100'));

        })

        it('user2 stakes 80', async () => {

            await lp_token.approve(pool1.address, web3.utils.toWei('80'), {from: testUser2});

            await pool1.stake(web3.utils.toWei('80'), {from: testUser2});
            expect((await pool1.balanceOf(testUser2)).toString()).to.equal(web3.utils.toWei('80'));
        })

        it('user3 stakes 20', async () => {

            await lp_token.approve(pool1.address, web3.utils.toWei('20'), {from: testUser3});

            await pool1.stake(web3.utils.toWei('20'), {from: testUser3});
            expect((await pool1.balanceOf(testUser3)).toString()).to.equal(web3.utils.toWei('20'));
        })

        it('user2 should get reward at 80tokens/sec', async() => {

            await time.increase(1000);

            console.log("Gas for withdraw: ", (await pool1.withdraw.estimateGas((await pool1.balanceOf(testUser2)), {from: testUser2})))

            // await pool1.exit({from: testUser2});
            await pool1.withdraw((await pool1.balanceOf(testUser2)), {from: testUser2});
            await pool1.getReward({from: testUser2});

            expect((await pool1.balanceOf(testUser2)).toString()).to.equal(web3.utils.toWei('0'));
            expect(parseInt(await token.balanceOf(testUser2))).to.be.closeTo(80*1000, 200);
            expect((await lp_token.balanceOf(testUser2)).toString()).to.equal(web3.utils.toWei('80'));

        })

        it('user3 should get reward at 20tokens/sec', async() => {

            // await pool1.exit({from: testUser3});
            await pool1.withdraw((await pool1.balanceOf(testUser3)), {from: testUser3});
            await pool1.getReward({from: testUser3});

            expect((await pool1.balanceOf(testUser3)).toString()).to.equal(web3.utils.toWei('0'));
            expect(parseInt(await token.balanceOf(testUser3))).to.be.closeTo(20*1000, 200);
            expect((await lp_token.balanceOf(testUser3)).toString()).to.equal(web3.utils.toWei('20'));

        })
    })

    describe('updating reward rate', async() => {

        it('users [!owner] should not be able to update reward rate', async() => {
            newRewardRate = 200;
            expectRevert(pool1.updateRewardRate(newRewardRate, {from: testUser1}), "Ownable: caller is not the owner");
        })
        
        it('owner should be able to update reward rate', async () => {
            newRewardRate = 200;
            await pool1.updateRewardRate(newRewardRate, {from: owner});

            expect(parseInt(await pool1.rewardRate())).to.equal(200);
        })        
    })
})