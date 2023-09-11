const { Fincra } = require('fincra-node-sdk'); // JavaScript
const dotenv = require('dotenv');
dotenv.config();
const FINCRA_PRIVATE_KEY = process.env.FINCRA_PRIVATE_KEY;
const FINCRA_PUBLIC_KEY = process.env.FINCRA_PUBLIC_KEY;

const getBankDepositAddress = async (amount, merchantReference) => {
  merchantReference += '';
  amount += '';

  const fincra = new Fincra(FINCRA_PUBLIC_KEY, FINCRA_PRIVATE_KEY, {
    sandbox: false,
  });

  //   const business = await fincra.business.getBusinessId();
  //   console.log(business);

  const data = {
    expiresAt: '43800', // 1 month expiry
    amount,
    merchantReference,
  };

  let p = {};
  try {
    p = await fincra.collection.payWithTransfer(data);

    return {
      accountNumber: p.data.accountInformation.accountNumber,
      accountName: p.data.accountInformation.accountName,
      bankName: p.data.accountInformation.bankName,
      bankCode: p.data.accountInformation.bankCode,
      _id: p.data._id,
      business: p.data.business,
    };
  } catch (error) {
    console.log(error.message, JSON.stringify(p, null, 2));
    return { error: error.message.error };
  }
};

// getBankDepositAddress('100', '1234567');

module.exports = { getBankDepositAddress };
