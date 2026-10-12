package com.cinebook.cinebook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CinebookApplication {

	public static void main(String[] args) {
		SpringApplication.run(CinebookApplication.class, args);
	}

}
