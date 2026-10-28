package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class Aging implements Serializable {
    private double notDue;
    private double overdueUnder30;
    private double overdueOver30;
}
