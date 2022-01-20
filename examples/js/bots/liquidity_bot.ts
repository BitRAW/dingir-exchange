import { defaultClient } from "../client";
import { ORDER_SIDE_ASK, ORDER_SIDE_BID, ORDER_TYPE_LIMIT, TestUser } from "../config";

const base = "DIF";
const quote = "BTC";
const market = `${base}_${quote}`;
const botUseFunds = 0.8; // Use 80% of funds
const deviation = 1.002;
const tiersAmount = 10;
const fee = "0";
const balanceCache = {};

const tick = async (user_id: TestUser) => {
  await defaultClient.connect();
  const balance = await defaultClient.balanceQuery(user_id);

  const Q_BAL = (+balance.get(quote).available + +balance.get(quote).frozen) * botUseFunds;
  const B_BAL = (+balance.get(base).available + +balance.get(base).frozen) * botUseFunds;

  if (balanceCache[quote] === Q_BAL && balanceCache[base] === B_BAL) {
    console.log("not trades happend, skipping");
    return;
  }

  balanceCache[quote] = Q_BAL;
  balanceCache[base] = B_BAL;

  await defaultClient.orderCancelAll(user_id, market);

  const getPrice = (tier: number, side: number) => {
    return (Q_BAL * Math.pow(deviation, side * (2 * tier + 1))) / B_BAL;
  };

  const orders = new Array(tiersAmount).fill(null).reduce((acc: any[], _, tier) => {
    const askPrice = getPrice(tier, 1);
    const bidPrice = getPrice(tier, -1);
    const askOrder = {
      market,
      order_side: ORDER_SIDE_ASK,
      order_type: ORDER_TYPE_LIMIT,
      amount: (B_BAL / tiersAmount).toFixed(6),
      price: askPrice.toFixed(6),
      taker_fee: fee,
      maker_fee: fee,
    };

    const bidOrder = {
      market,
      order_side: ORDER_SIDE_BID,
      order_type: ORDER_TYPE_LIMIT,
      amount: (B_BAL / tiersAmount).toFixed(6),
      price: bidPrice.toFixed(6),
      taker_fee: fee,
      maker_fee: fee,
    };

    acc = [...acc, askOrder, bidOrder];
    return acc;
  }, []);

  await defaultClient.batchOrderPut(user_id, market, false, orders);
};

setInterval(() => {
  tick(TestUser.USER1);
}, 2000);
