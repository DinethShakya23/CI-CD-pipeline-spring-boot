package com.application.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApplicationStatusController {

    private static final long START_TIME = ManagementFactory.getRuntimeMXBean().getStartTime();
    private static final String VERSION = "1.0";
    private static final String BUILD_STATUS = "passing";

    @GetMapping("/status")
    public Map<String, Object> getApplicationStatus() {
        Map<String, Object> status = new HashMap<>();
        
        // Application info
        status.put("version", VERSION);
        status.put("buildStatus", BUILD_STATUS);
        status.put("health", "UP");
        
        // Uptime calculation
        long uptimeMillis = System.currentTimeMillis() - START_TIME;
        Duration uptime = Duration.ofMillis(uptimeMillis);
        status.put("uptimeSeconds", uptime.getSeconds());
        status.put("uptimeFormatted", formatUptime(uptime));
        
        // Server info
        status.put("timestamp", System.currentTimeMillis());
        status.put("startTime", START_TIME);
        
        return status;
    }

    @GetMapping("/health")
    public Map<String, Object> getHealthStatus() {
        Map<String, Object> health = new HashMap<>();
        
        health.put("status", "UP");
        health.put("healthy", true);
        
        // Memory info
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        Map<String, Object> memory = new HashMap<>();
        memory.put("used", formatBytes(usedMemory));
        memory.put("max", formatBytes(maxMemory));
        memory.put("usagePercent", (int) ((usedMemory * 100) / maxMemory));
        
        health.put("memory", memory);
        
        return health;
    }

    @GetMapping("/metrics")
    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        // System metrics
        Runtime runtime = Runtime.getRuntime();
        metrics.put("processors", runtime.availableProcessors());
        
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        Map<String, String> memory = new HashMap<>();
        memory.put("total", formatBytes(totalMemory));
        memory.put("free", formatBytes(freeMemory));
        memory.put("used", formatBytes(usedMemory));
        
        metrics.put("memory", memory);
        
        // Thread info
        Map<String, Integer> threads = new HashMap<>();
        threads.put("count", Thread.activeCount());
        metrics.put("threads", threads);
        
        return metrics;
    }

    @GetMapping("/info")
    public Map<String, Object> getApplicationInfo() {
        Map<String, Object> info = new HashMap<>();
        
        info.put("name", "spring-boot-demo");
        info.put("version", VERSION);
        info.put("description", "CI/CD Pipeline Spring Boot Application");
        
        Map<String, String> build = new HashMap<>();
        build.put("status", BUILD_STATUS);
        build.put("java", System.getProperty("java.version"));
        build.put("springBoot", "2.2.4.RELEASE");
        
        info.put("build", build);
        
        Map<String, String> deployment = new HashMap<>();
        deployment.put("method", "CI/CD Pipeline");
        deployment.put("containerization", "Docker");
        deployment.put("orchestration", "Kubernetes");
        deployment.put("cd", "Argo CD");
        
        info.put("deployment", deployment);
        
        return info;
    }

    private String formatUptime(Duration duration) {
        long hours = duration.toHours();
        long minutes = duration.toMinutesPart();
        long seconds = duration.toSecondsPart();
        return String.format("%02d:%02d:%02d", hours, minutes, seconds);
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
