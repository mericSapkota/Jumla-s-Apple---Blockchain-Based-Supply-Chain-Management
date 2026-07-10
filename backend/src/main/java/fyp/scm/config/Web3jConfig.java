package fyp.scm.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.crypto.Credentials;
import org.web3j.tx.gas.ContractGasProvider;
import org.web3j.tx.gas.StaticGasProvider;
import java.math.BigInteger;

@Configuration
public class Web3jConfig {

    @Value("${web3j.client-address}")
    private String clientAddress;

    @Value("${web3j.deployer-private-key}")
    private String privateKey;

    @Bean
    public Web3j web3j() {
        return Web3j.build(new HttpService(clientAddress));
    }

    @Bean
    public Credentials credentials() {
        return Credentials.create(privateKey);
    }

    @Bean
    public ContractGasProvider contractGasProvider() {

        // For many networks, 1,000,000 to 3,000,000 is sufficient
        BigInteger gasLimit = BigInteger.valueOf(1_500_000); // Lower than 9,000,000
        BigInteger gasPrice = BigInteger.valueOf(4_100_000_000L);

        return new StaticGasProvider(gasPrice, gasLimit);
    }
}