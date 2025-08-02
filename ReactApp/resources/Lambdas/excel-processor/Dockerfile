FROM ghcr.io/cargo-lambda/cargo-lambda:latest AS chef
WORKDIR /usr/src/app
RUN cargo install cargo-chef --locked

FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY lambda/excel-processor/Cargo.toml ./lambda/excel-processor/
RUN mkdir -p lambda/excel-processor/src && \
    touch lambda/excel-processor/src/main.rs && \
    cargo chef prepare --recipe-path recipe.json

FROM chef AS cacher
COPY --from=planner /usr/src/app/recipe.json recipe.json
ENV CARGO_NET_GIT_FETCH_WITH_CLI=true
ENV CARGO_REGISTRIES_CRATES_IO_PROTOCOL=sparse
RUN cargo chef cook --release --recipe-path recipe.json

FROM chef AS builder
WORKDIR /usr/src/app
ENV PACKAGE=excel-processor
ENV TARGETPLATFORM=linux/arm64
ENV CARGO_NET_GIT_FETCH_WITH_CLI=true
ENV CARGO_REGISTRIES_CRATES_IO_PROTOCOL=sparse

COPY --from=cacher /usr/src/app/target target
COPY Cargo.toml Cargo.lock ./
COPY lambda/ ./lambda/

RUN case ${TARGETPLATFORM} in \
    "linux/amd64") RUST_ARCH=x86_64-unknown-linux-gnu ;; \
    "linux/arm64") RUST_ARCH=aarch64-unknown-linux-gnu ;; \
    *) exit 1 ;; \
    esac && \
    cargo lambda build --release --target ${RUST_ARCH} -p ${PACKAGE}

FROM public.ecr.aws/lambda/provided:al2023
ENV PACKAGE=excel-processor
COPY --from=builder /usr/src/app/target/lambda/${PACKAGE}/bootstrap ${LAMBDA_RUNTIME_DIR}/bootstrap
RUN chmod +x ${LAMBDA_RUNTIME_DIR}/bootstrap
CMD [ "bootstrap" ]