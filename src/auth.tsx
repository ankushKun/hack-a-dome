'use client';


import { OauthClient } from "@zk-email/oauth-sdk";
import { createPublicClient, Address as ViemAddress, http } from 'viem';
import { baseSepolia } from "viem/chains"
import {
    ConnectWallet,
    Wallet,
    WalletDefault,
    WalletDropdown,
    WalletDropdownBasename,
    WalletDropdownLink,
    WalletDropdownDisconnect,
    WalletDropdownFundLink,
} from '@coinbase/onchainkit/wallet';
import {
    Address,
    Avatar,
    Badge,
    EthBalance,
    Name,
    Identity
} from '@coinbase/onchainkit/identity';

function WalletWrapper() {

    return (
        <>
            <Wallet className="mr-auto m-5">
                <ConnectWallet text="Connect with BASE" onConnect={() => {
                    localStorage.setItem("connected", "true");
                    window.location.reload();
                }}>
                    <Avatar className="h-6 w-6" />
                    <Name />
                </ConnectWallet>
                <WalletDropdown>
                    <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick={true}>
                        <Avatar />
                        <Name />
                        <Address />
                        <EthBalance />
                    </Identity>
                    <WalletDropdownBasename />
                    <WalletDropdownLink icon="wallet" href="https://wallet.coinbase.com" target="_blank">
                        Go to Wallet Dashboard
                    </WalletDropdownLink>
                    <WalletDropdownFundLink />
                    <WalletDropdownDisconnect />
                </WalletDropdown>
            </Wallet>
        </>
    );
}

export default function Auth() {

    const publicClient = createPublicClient({
        chain: baseSepolia, // Chain
        transport: http("https://sepolia.base.org"), // Transport URL
    });
    const coreAddress: ViemAddress = '0x3C0bE6409F828c8e5810923381506e1A1e796c2F'; // Your core contract address. This prefilled default is already deployed on Base Sepolia
    const oauthAddress: ViemAddress = '0x8bFcBe6662e0410489d210416E35E9d6B62AF659'; // Your OAuth core contract address, deployed on Base Sepolia
    const relayerHost: string = "https://oauth-api.emailwallet.org"; // Your relayer host; this one is public and deployed on Base Sepolia




    return <div className="h-screen flex flex-col items-center justify-center">
        <div className="text-5xl">Hack-A-Dome</div>
        <div className="text-md text-gray-400">Almost "onchain" gathertown ;)</div>
        <div className="flex items-center justify-center mx-auto w-fit my-20">
            <div className="m-5 w-fit ml-auto">
                <div className="text-center">
                    Login with zkEmail
                </div>
                <div className="flex flex-col mx-auto w-fit p-1 gap-1">
                    <input type="text" id="username" placeholder="email" className="ring-1 ring-black/20 rounded-md p-1" />
                    <input type="password" id="password" placeholder="password" className="ring-1 ring-black/20 rounded-md p-1" />
                </div>
                <button onClick={async () => {
                    const username = (document.getElementById("username") as HTMLInputElement).value;
                    const password = (document.getElementById("password") as HTMLInputElement).value;
                    const oauthClient = new OauthClient(publicClient as any, coreAddress, oauthAddress, relayerHost);
                    const result = await oauthClient.setup(username, password, null, null);
                    console.log(result);
                }} className="bg-blue-500 mx-auto block p-2 px-4 rounded-md text-white">Login</button>
            </div>
            <div className="text-gray-400 w-fit">or</div>
            <WalletWrapper />
        </div>
    </div>
}