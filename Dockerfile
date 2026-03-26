FROM gradle:8.14.4-jdk17 AS builder
WORKDIR /app

COPY build.gradle ./
COPY settings.gradle ./

RUN gradle dependencies --no-daemon

COPY ./src ./src
RUN gradle bootjar --no-daemon

FROM openjdk:17-ea-jdk

COPY --from=builder /app/build/libs/poticard-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]