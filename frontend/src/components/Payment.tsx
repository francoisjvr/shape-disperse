import { ethers } from "ethers";
import { useContext, useEffect, useState } from "react";
import ERC20 from "../artifacts/ERC20.json";
import Disperse from "../artifacts/Disperse.json";
import Confirm from "./Confirm";
import Recipients from "./Recipients";
import { NetworkContext } from "../App";
import { getNetworkInfo, parseText, getWarnMessage } from "../utils/index";
import Ether from "./Ether";
import { TxStatus } from "../types/Transaction";
import { RecipientInfo } from "../types/Recipient";

type TokenDetails = {
  name: string | null;
  symbol: string | null;
  balance: string | null;
};

type PaymentProps = {
  address: string;
};

const Payment = ({ address }: PaymentProps) => {
  const defaultTokenDetails: TokenDetails = {
    name: null,
    symbol: null,
    balance: null,
  };
  const { chainId } = useContext(NetworkContext);
  const [currentLink, setCurrentLink] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenDetails, setTokenDetails] =
    useState<TokenDetails>(defaultTokenDetails);
  const [textValue, setTextValue] = useState("");
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [recipientsData, setRecipientsData] = useState<RecipientInfo[]>([]);
  const [total, setTotal] = useState<ethers.BigNumber | null>(null);
  const [remaining, setRemaining] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus | null>(null);
  const [approveStatus, setApproveStatus] = useState<TxStatus | null>(null);
  const [isInvalidToken, setIsInvalidToken] = useState(false);
  const networkInfo = getNetworkInfo(chainId);
  const disperseAddress = networkInfo?.disperseAddress;

  const getEthBalance = async (ethereum: any) => {
    if (!ethBalance) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const balance = await provider.getBalance(address);
      const ethBalance = ethers.utils.formatEther(balance);
      setEthBalance(ethBalance);
    }
  };

  const loadToken = async () => {
    setIsInvalidToken(false);
    setTokenDetails(defaultTokenDetails);
    try {
      setIsTokenLoading(true);
      const { ethereum } = window;
      if (ethereum && tokenAddress !== "") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const erc20 = new ethers.Contract(tokenAddress, ERC20.abi, signer);
        const name = await erc20.name();
        const symbol = await erc20.symbol();
        const balance = await erc20.balanceOf(address);
        setTokenDetails({
          name,
          symbol,
          balance: ethers.utils.formatEther(balance),
        });
      }

      if (!networkInfo) {
        const warnMessage = getWarnMessage();
        setWarn(warnMessage);
      }
    } catch (error) {
      setIsInvalidToken(true);
      console.log(error);
    } finally {
      setIsTokenLoading(false);
    }
  };

  useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      getEthBalance(ethereum);
    }
  }, [currentLink]);

  const approve = async () => {
    setApproveStatus(null);
    try {
      const { ethereum } = window;
      if (ethereum && tokenAddress !== "" && total && disperseAddress) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const erc20 = new ethers.Contract(tokenAddress, ERC20.abi, signer);

        const txn = await erc20.approve(disperseAddress, total);
        setApproveStatus({
          status: "pending",
          hash: txn.hash,
        });

        await txn.wait();
        setApproveStatus({
          status: "success",
          hash: txn.hash,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const disperse = async () => {
    try {
      const { ethereum } = window;
      if (
        ethereum &&
        tokenAddress !== "" &&
        recipientsData.length > 0 &&
        disperseAddress
      ) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const disperse = new ethers.Contract(
          disperseAddress,
          Disperse.abi,
          signer
        );

        const recipients = recipientsData.map((recipient) => recipient.address);
        const values = recipientsData.map((recipient) => recipient.value);

        const txn = await disperse.disperseToken(
          tokenAddress,
          recipients,
          values
        );
        setTxStatus({
          status: "pending",
          hash: txn.hash,
        });

        await txn.wait();
        setTxStatus({
          status: "success",
          hash: txn.hash,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (textValue !== "") {
      const updatedRecipients = parseText(textValue);
      setRecipientsData(updatedRecipients);
    }
  }, [textValue]);

  useEffect(() => {
    if (recipientsData.length > 0) {
      let newTotal = recipientsData[0].value;
      for (let i = 1; i < recipientsData.length; i++) {
        newTotal = newTotal.add(recipientsData[i].value);
      }
      setTotal(newTotal);
    } else {
      setTotal(null);
    }
  }, [recipientsData]);

  useEffect(() => {
    if (tokenDetails.balance && total) {
      const tokenBalance = ethers.utils.parseEther(tokenDetails.balance);
      const remaining = tokenBalance.sub(total);
      setRemaining(ethers.utils.formatEther(remaining));
    } else {
      setRemaining(null);
    }
  }, [total]);

  return (
    <div className="pt-16">
      <h3 className="text-2xl font-light italic">
        send
        <span
          onClick={() => setCurrentLink("ether")}
          className={`border-gray-600 border-b-2 ${
            currentLink !== "ether" ? "text-gray-500" : ""
          }`}
        >
          {" "}
          ether{" "}
        </span>
        or
        <span
          onClick={() => setCurrentLink("token")}
          className={`border-gray-600 border-b-2 ${
            currentLink !== "token" ? "text-gray-500" : ""
          }`}
        >
          {" "}
          token
        </span>
      </h3>

      {currentLink === "ether" && <Ether address={address} />}
      {currentLink === "token" && (
        <div className="mt-12 mb-24">
          <h3 className="text-2xl font-light italic">token address</h3>
          <div className="flex mt-6">
            <input
              type="text"
              className="text-l py-2 px-1 border-b-2 border-black outline-none max-w-3xl"
              placeholder="0x2b1F577230F4D72B3818895688b66abD9701B4dC"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              style={{
                width: "100%",
                background: "aquamarine",
                color: "#768882",
              }}
            />
            <button
              onClick={loadToken}
              className="ml-4 px-2"
              style={{
                background: "aquamarine",
                boxShadow: "6px 6px crimson",
              }}
            >
              load
            </button>
          </div>
          {isTokenLoading && (
            <p className="pt-4 text-l font-light italic">
              loading token info ...
            </p>
          )}
          {isInvalidToken && (
            <p className="pt-4 text-l font-light text-red-400 italic">
              unsupported token
            </p>
          )}
          {!isTokenLoading && tokenDetails.name && (
            <>
              <p className="pt-4 text-l font-light">
                you have {tokenDetails.balance}{" "}
                <span className="pt-1 text-xs">{tokenDetails.symbol}</span> (
                {tokenDetails.name})
              </p>
              {warn && <p className="italic text-red-400">{warn}</p>}
              {!warn && (
                <Recipients
                  tokenSymbol={tokenDetails.symbol}
                  textValue={textValue}
                  setTextValue={setTextValue}
                />
              )}
              {recipientsData.length > 0 && (
                <Confirm
                  recipientsData={recipientsData}
                  total={total}
                  tokenBalance={tokenDetails.balance}
                  remaining={remaining}
                  approve={approve}
                  disperse={disperse}
                  txStatus={txStatus}
                  approveStatus={approveStatus}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Payment;
