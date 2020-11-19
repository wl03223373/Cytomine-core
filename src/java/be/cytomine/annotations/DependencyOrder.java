package be.cytomine.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
/**
 * Determines a priority into dependencies.
 * */
public @interface DependencyOrder {
    /**
     * A method with an higher value will be executed before the others.
     * */
    public int order() default Integer.MIN_VALUE;
}
