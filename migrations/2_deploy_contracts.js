// for deploy:
// > truffle migrate --network rinkeby
// or
// > truffle migrate --network bsctestnet
// for verify:
// > truffle run verify PieBridge@0xb33722ae32B6C854a04fb0cF0D709aFC5b97BAfB --network rinkeby
// or
// > truffle run verify PieBridge@0xd572aebED5233418747bE456E49e5b72F283826A --network bsctestnet

const Bridge = artifacts.require("PieBridge");

module.exports = async function(deployer) {
    let courier = '0x9D19Be3814dB048C73F804db05d59a3EBd0F20B3';

    let pieBSC = '0xd50da88069c69BF093e8dca1532Cc81711D9e0F4';
    let pieRinkeby = '0xb36afc9f38d8ac6f991bb9939d3ee8d45a7a1285';

    await deployer.deploy(Bridge,
        courier,
        pieBSC
    );

    const bridge = await Bridge.deployed();

    console.log('PieBridge', bridge.address);
};
