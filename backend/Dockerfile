# Stage 1: Build
FROM maven:3.9.11-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a dedicated non-root system group and user.
# -S = system account (no password, no home dir, no shell)
# Running as non-root means even if the JVM or app is compromised,
# the attacker cannot write to system paths or escalate privileges.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Give the new user ownership of the jar
RUN chown appuser:appgroup app.jar

# Drop root — all subsequent commands and the final process run as appuser
USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
