# Evidencia de execucao - Atividade 30: Limpeza de recursos

Gerado em: 2026-08-28 14:26:07 -0300

## Comandos e saída

```
$ docker system df
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          14        10        2.598GB   333MB (12%)
Containers      23        7         25.38MB   86.02kB (0%)
Local Volumes   7         5         296.5MB   18B (0%)
Build Cache     52        0         811MB     81.35MB

$ docker container prune -f
Deleted Containers:
726167aaaf8904f45b8fb99965f02d73680019220203a659af8a44d2ceb025e1
e4aa6f0768e7415ab18bd17dfb6880b0f7d9d02cff51e599ba908ff2a500315d
61cfe0a98a7ddd7fe7ec034feb2218aae316134d3947e5316b2c3b746809c0f7
fe403a86df6aa2461c44c0e6423a2cb05d8c165e57fad4eb634138458b1df21e
16c68f1c6bfb1a91936b6516f1e27822fffe6a6e45ef2e3c4dcf3fea55305011
e8b8b4d035b33955e2933f6b6ca0932bfce2e47467f118330ada8fd000942308
24b621f3f2a9f6cc0450951bc9a273c4f1f86e49f9bbe071234b25bec1529894
e27dfd87fbd041912936812554127deb9b82516a025771c072e8482ea24f0b72
0ece3b9bd2c18af8cd68357ae8754b7d6da51e2226fd012ae56b69b38cbbf877
28af77b8e01df1c5de355667ae263388c25a1ee19662bebdeaa09a54dd7025b6
61261f9e7cb1e08b450b3b206dd81b5d895e3292cbe6fbd2cb0153ce2c134204
f35f60df46f553fbd4af6f9b09cce3710b8478c2dda07a49712476690ecdb042
f0f0f15a60812adf03b30cb6cd5d7fd70bcf9f01965d84d18684e8ebee536843
561649176dbfb29852dc34efe368413a3727298c56e9dee7cb53a8f5655dd944
42f33272d740e52a7f99648640f8ccd58115c966361bc14698ebcc91fdb1c7b6
02d1e8bfe1bd3061c4c52562e7251daa5576984fa9329bfbf1587b79140e6607

Total reclaimed space: 86.02kB

$ docker image prune -f
Total reclaimed space: 0B

$ docker system df
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          14        2         2.598GB   1.917GB (73%)
Containers      7         7         25.29MB   0B (0%)
Local Volumes   7         2         296.5MB   217.6MB (73%)
Build Cache     52        0         811MB     81.35MB

```

