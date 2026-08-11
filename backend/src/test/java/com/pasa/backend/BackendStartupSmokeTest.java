package com.pasa.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
    "pasa.jwt.secret=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
})
class BackendStartupSmokeTest {

    @Autowired
    private ApplicationContext context;

    @Test
    void contextLoadsWithoutExternalDatasource() {
        assertThat(context).isNotNull();
    }
}
