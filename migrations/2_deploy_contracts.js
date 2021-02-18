// for deploy:
// > truffle migrate --network rinkeby
// for verify:
// truffle run verify PieBridge@0xAcCd67fe87b8A657e9dCCFAE2770e49260f9c034 --network rinkeby

const Bridge = artifacts.require("PieBridge");

module.exports = async function(deployer) {
    let admin = '0x9D19Be3814dB048C73F804db05d59a3EBd0F20B3';

    let pieBSC = '0xd50da88069c69BF093e8dca1532Cc81711D9e0F4';
    let pieRinkeby = '0xb36afc9f38d8ac6f991bb9939d3ee8d45a7a1285';

    await deployer.deploy(Bridge,
        admin,
        pieRinkeby
    );

    const bridge = await Bridge.deployed();

    console.log('PieBridge', bridge.address);
};
