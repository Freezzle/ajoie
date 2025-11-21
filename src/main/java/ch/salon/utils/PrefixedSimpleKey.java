package ch.salon.utils;

import org.springframework.util.Assert;
import org.springframework.util.StringUtils;

import java.io.Serializable;
import java.util.Arrays;

public class PrefixedSimpleKey implements Serializable {
    private final String prefix;
    private transient Object[] params;
    private final String methodName;
    private int hashCodeValue;

    public PrefixedSimpleKey(String prefix, String methodName, Object... elements) {
        Assert.notNull(prefix, "Prefix must not be null");
        Assert.notNull(elements, "Elements must not be null");
        this.prefix = prefix;
        this.methodName = methodName;
        this.params = new Object[elements.length];
        System.arraycopy(elements, 0, this.params, 0, elements.length);
        this.hashCodeValue = prefix.hashCode();
        this.hashCodeValue = 31 * this.hashCodeValue + methodName.hashCode();
        this.hashCodeValue = 31 * this.hashCodeValue + Arrays.deepHashCode(this.params);
    }

    public boolean equals(Object other) {
        return this == other || other instanceof ch.salon.utils.PrefixedSimpleKey && this.prefix.equals(((ch.salon.utils.PrefixedSimpleKey)other).prefix) && this.methodName.equals(((ch.salon.utils.PrefixedSimpleKey)other).methodName) && Arrays.deepEquals(this.params, ((ch.salon.utils.PrefixedSimpleKey)other).params);
    }

    public final int hashCode() {
        return this.hashCodeValue;
    }

    public String toString() {
        String var10000 = this.prefix;
        return var10000 + " " + this.getClass().getSimpleName() + this.methodName + " [" + StringUtils.arrayToCommaDelimitedString(this.params) + "]";
    }
}
