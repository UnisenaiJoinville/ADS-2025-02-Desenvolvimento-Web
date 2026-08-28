# Evidencia de execucao - Atividade 07: Executando uma imagem

Gerado em: 2026-08-28 14:22:46 -0300

## Comandos e saída

```
$ docker run minha-imagem

$ docker ps -a --filter ancestor=minha-imagem
CONTAINER ID   IMAGE          COMMAND       CREATED        STATUS                              PORTS     NAMES
e4aa6f0768e7   minha-imagem   "/bin/bash"   1 second ago   Exited (0) Less than a second ago             confident_bell

$ docker run --rm minha-imagem curl --version
curl 8.18.0 (x86_64-pc-linux-gnu) libcurl/8.18.0 OpenSSL/3.5.5 zlib/1.3.1 brotli/1.2.0 zstd/1.5.7 libidn2/2.3.8 libpsl/0.21.2 libssh2/1.11.1 nghttp2/1.68.0 librtmp/2.3 mit-krb5/1.22.1 OpenLDAP/2.6.10
Release-Date: 2026-01-07, security patched: 8.18.0-1ubuntu2.4
Protocols: dict file ftp ftps gopher gophers http https imap imaps ipfs ipns ldap ldaps mqtt pop3 pop3s rtmp rtsp scp sftp smb smbs smtp smtps telnet tftp ws wss
Features: alt-svc AsynchDNS brotli GSS-API HSTS HTTP2 HTTPS-proxy IDN IPv6 Kerberos Largefile libz NTLM PSL SPNEGO SSL threadsafe TLS-SRP UnixSockets zstd

```

