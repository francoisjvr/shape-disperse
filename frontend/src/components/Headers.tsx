import { useContext } from "react";
import { NetworkContext } from "../App";
import EthereumSVG from "../assets/ethereum.svg";

type HeaderProps = {
  address: string | null;
};

const Header = ({ address }: HeaderProps) => {
  const networkContext = useContext(NetworkContext);

  return (
    <div>
      <div className="flex space-between">
        <img
          src={EthereumSVG}
          style={{
            width: "50px",
            height: "50px",
            marginLeft: "-50px",
          }}
          alt="Ethereum SVG"
        />
        <h2 className="mt-8 text-4xl font-light">disperse</h2>
        {address && (
          <span className="text-l pt-2 font-light">
            {networkContext.network || "🤔"}
          </span>
        )}
      </div>
      <div></div>
      <p className="pt-8 text-l font-light">
        <i>verb</i> distribute ether or tokens to multiple addresses
      </p>
    </div>
  );
};

export default Header;
