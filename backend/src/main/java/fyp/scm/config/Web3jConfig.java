package fyp.scm.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.crypto.Credentials;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;
import org.web3j.tx.gas.StaticGasProvider;
import java.math.BigInteger;

@Configuration
public class Web3jConfig {

    @Value("${web3j.client-address}")
    private String clientAddress;

    @Value("${web3j.deployer-private-key}")
    private String privateKey;

    // Must match the network `web3j.client-address` points at:
    //   Sepolia = 11155111, Ganache = 1337, Hardhat = 31337.
    // Signing with the wrong chain id (or none) produces transactions that
    // public RPC providers (Infura/Alchemy) reject, since they require
    // EIP-155 replay protection.
    @Value("${web3j.chain-id}")
    private long chainId;

    // Static gas settings. On Sepolia the base fee floats, so keep the price
    // comfortably above it (testnet gas is free) — a price below the current
    // base fee gets the transaction rejected or stuck pending.
    @Value("${web3j.gas-price-wei}")
    private long gasPriceWei;

    @Value("${web3j.gas-limit}")
    private long gasLimit;

    @Bean
    public Web3j web3j() {
        return Web3j.build(new HttpService(clientAddress));
    }

    @Bean
    public Credentials credentials() {
        return Credentials.create(privateKey);
    }

    // Signs the backend's own writes (assignRole) with the chain id so the
    // transaction is EIP-155 replay-protected — required by public Sepolia RPCs.
    @Bean
    public TransactionManager web3jTransactionManager(Web3j web3j, Credentials credentials) {
        return new RawTransactionManager(web3j, credentials, chainId);
    }

    @Bean
    public ContractGasProvider contractGasProvider() {
        return new StaticGasProvider(
                BigInteger.valueOf(gasPriceWei),
                BigInteger.valueOf(gasLimit));
    }
}
