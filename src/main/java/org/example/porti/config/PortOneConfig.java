package org.example.porti.config;

import io.portone.sdk.server.PortOneClient;
import io.portone.sdk.server.payment.PaymentClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PortOneConfig {

    @Value("${portone.portone_secret}")
    private String portoneSecret;

    @Bean
    public PaymentClient paymentClient() {
        PortOneClient portOneClient = new PortOneClient(portoneSecret, "https://api.portone.io", null);
        return portOneClient.getPayment();
    }
}