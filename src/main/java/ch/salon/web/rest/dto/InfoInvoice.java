package ch.salon.web.rest.dto;

import java.io.Serializable;

public class InfoInvoice implements Serializable {
    boolean hasDraftInvoices = false;
    boolean hasWaitingInvoices = false;
    boolean hasExpiredInvoices = false;

    public boolean isHasDraftInvoices() {
        return hasDraftInvoices;
    }

    public void setHasDraftInvoices(boolean hasDraftInvoices) {
        this.hasDraftInvoices = hasDraftInvoices;
    }

    public boolean isHasWaitingInvoices() {
        return hasWaitingInvoices;
    }

    public void setHasWaitingInvoices(boolean hasWaitingInvoices) {
        this.hasWaitingInvoices = hasWaitingInvoices;
    }

    public boolean isHasExpiredInvoices() {
        return hasExpiredInvoices;
    }

    public void setHasExpiredInvoices(boolean hasExpiredInvoices) {
        this.hasExpiredInvoices = hasExpiredInvoices;
    }
}
