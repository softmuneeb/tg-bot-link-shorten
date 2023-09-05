const { Fincra } = require('fincra-node-sdk'); // JavaScript
const dotenv = require('dotenv');
dotenv.config();
const FINCRA_PRIVATE_KEY = process.env.FINCRA_PRIVATE_KEY;
const FINCRA_PUBLIC_KEY = process.env.FINCRA_PUBLIC_KEY;

const fincra = new Fincra(FINCRA_PUBLIC_KEY, FINCRA_PRIVATE_KEY, {
  sandbox: false,
});

const driver = async () => {
  //   const business = await fincra.business.getBusinessId();
  //     console.log(business);

  const data = {
    expiresAt: '60',
    amount: '100',
    merchantReference: 'a2',
  };

  const payWithTransfer = await fincra.collection.payWithTransfer(data);
  console.log(payWithTransfer);
};

driver();
