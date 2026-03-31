# Debugging, Monitoring, and Performance Guide

## Overview

This guide provides a comprehensive overview of the tools and techniques available for debugging, monitoring, and profiling a running JUDO application. It covers everything from rapid development workflows to production troubleshooting.

## Table of Contents

- [Hot Deployment Workflow (Development)](#hot-deployment-workflow-development)
- [Logging](#logging)
- [Remote Debugging](#remote-debugging)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Performance Monitoring](#performance-monitoring)
- [Troubleshooting](#troubleshooting)

---

## Hot Deployment Workflow (Development)

Hot deployment allows you to apply backend code changes to a running server without a full restart, enabling a fast and efficient development loop.

1.  **Start the Karaf server** in one terminal:
    ```bash
    ./judo.sh start
    ```

2.  **Make changes** in your custom code (e.g., in `application/app/` or `application/interceptors/`).

3.  **Build only the changed module** from within its own directory:
    ```bash
    cd application/app
    mvn install
    ```

4.  **Watch the Karaf logs** to confirm the bundle is updated. The running server will automatically detect the changed JAR and redeploy it.
    ```bash
    tail -f application/.karaf/data/log/karaf.log
    ```
    You should see a message like `Bundle updated: northwind-app`.

5.  **Test your changes immediately** in the running application.

---

## Logging

JUDO applications use the **SLF4J** facade over the **Log4j 2** implementation.

### Adding Logs to Custom Code
The recommended approach is to use the `@Slf4j` annotation from Lombok to reduce boilerplate code.

```java
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CustomOperation implements operation.demo.CustomOperation {

    @Override
    public void apply(InputParameter inputParameter) {
        log.info("Custom operation called with input: {}", inputParameter);
        log.debug("Detailed input: {}", inputParameter.getDetails());
        
        try {
            // ... operation logic ...
        } catch (Exception e) {
            log.error("Error during custom operation", e);
            throw e;
        }
    }
}
```

### Mapped Diagnostic Context (MDC)
JUDO automatically enriches every log message with a request-specific context, which is invaluable for tracing and debugging in a multi-user environment.

| MDC Attribute | Description |
| :--- | :--- |
| `RequestExchangeId` | A unique identifier for the entire HTTP request. |
| `operation` | The fully qualified name of the JUDO operation being executed. |
| `user` | The username from the OAuth 2.0 access token. |

### Changing Log Levels at Runtime
You can dynamically change log levels for any package or class without restarting the application by using the Karaf console.

1.  Log in to the console: `application/.karaf/bin/client`
2.  Use the `log:set` command. For example, to enable detailed SQL logging:
    ```karaf
    log:set DEBUG hu.blackbelt.judo.services.dao
    ```
    To reset to the default level, use `log:set DEFAULT <package>`.

---

## Remote Debugging

You can attach a Java debugger from your IDE (like IntelliJ or VS Code) to a running JUDO application.

### Enabling the Debugger
Start the JUDO application with the `KARAF_DEBUG` environment variable set to `true`.

```bash
export KARAF_DEBUG=true
# Optional: Configure the port and allow remote connections
export JAVA_DEBUG_PORT=*:5005

./judo.sh start
```
The JVM will start suspended, waiting for a debugger to attach on the specified port.

### Attaching from an IDE
1.  In your IDE, create a new **Remote JVM Debug** run configuration.
2.  Set the **Host** to `localhost` and the **Port** to `5005` (or your configured port).
3.  Start the debug configuration. Your IDE will attach to the running JVM, and you can now use breakpoints, inspect variables, and step through your custom Java code.

---

## Monitoring and Health Checks

### JMX Monitoring
Java Management Extensions (JMX) provide a standard way to monitor a running Java application.

*   **Tools**: `JConsole` (included with the JDK) or `VisualVM`.
*   **Key JUDO MBean**: `hu.blackbelt.judo:type=<ModelName>,name=Application`
*   **Key Attribute**: `Started` (boolean). You can monitor this attribute to confirm that the application has started successfully and all components are initialized.

### Application Health Checks
JUDO uses Apache Felix Health Check to provide a status endpoint for automated monitoring.

*   **Endpoint URL**: `http://localhost:8181/system/health?tags=<ModelName>`
*   **Checks**: The endpoint verifies that all models, operations, and platform components (Dispatcher, REST endpoints, persistence layer) have been deployed and initialized successfully. A `200 OK` response indicates a healthy application.

---

## Performance Monitoring

JUDO uses **Apache Karaf Decanter** to collect and store application metrics, which can be visualized with **Grafana**.

### Pattern: Measuring Code Performance
You can measure the execution time of specific blocks of your custom code to identify performance bottlenecks.

1.  Inject the `hu.blackbelt.judo.services.core.MetricsCollector` OSGi component.
2.  Use a `try-with-resources` block around the code you want to measure.

    ```java
    @Reference
    private MetricsCollector metricsCollector;

    public void myMeasuredMethod() {
        try (MetricsCollector.MetricsCancelToken token = metricsCollector.start("my-custom-timer")) {
            // ... code to be measured ...
        } // The timer stops automatically when the try block exits.
    }
    ```
*   **Built-in Timers**: The JUDO platform already measures key phases of every request, including: `dispatcher`, `call-script`, `call-sdk`, `dao-query`, and `dao-change`.

---

## Troubleshooting

### "Service not registered"
- **Cause**: Your custom OSGi component did not start correctly.
- **Solution**:
    - Check for `@Component` and that it implements a `@Service` interface.
    - Verify the bundle is `ACTIVE` in the Karaf console: `bundle:list | grep northwind-app`
    - Check the Karaf logs (`log:tail`) for OSGi errors related to your bundle.

### "ClassNotFoundException"
- **Cause**: A required class is not available to your bundle's classloader.
- **Solution**:
    - Ensure the dependency is correctly defined in your `pom.xml`.
    - Check the OSGi `Import-Package` statement in your bundle's `MANIFEST.MF`.
    - Rebuild the entire project to ensure all dependencies are correctly packaged: `mvn clean install`.

### Changes not applied after Hot Deployment
- **Cause**: Karaf did not correctly pick up the changes to your bundle.
- **Solution**:
    - Confirm the bundle's timestamp was updated in the Karaf console: `bundle:list -t 0 | grep northwind-app`
    - Check the JAR timestamp in your local Maven repository (`~/.m2/repository/...`).
    - If needed, force a refresh or restart the bundle manually in the Karaf console: `bundle:refresh [id]` or `bundle:restart [id]`.

---

## See Also
- [Testing Guide](testing-guide.md) - For how to write unit and integration tests.
- [Custom Operations](custom-operations.md) - For the business logic you may be debugging.
- [Patterns and Best Practices](patterns-and-best-practices.md) - For other common backend patterns.