# Evidencia de execucao - Atividade 12: Conectando-se a um container em execução

Gerado em: 2026-08-28 14:23:17 -0300

## Comandos e saída

```
$ echo "(equivalente interativo: docker exec -it at08-nginx bash)"
(equivalente interativo: docker exec -it at08-nginx bash)

$ docker exec at08-nginx bash -c "apt-get update -qq && apt-get install -y -qq procps >/dev/null && ps aux"
debconf: unable to initialize frontend: Dialog
debconf: (TERM is not set, so the dialog frontend is not usable.)
debconf: falling back to frontend: Readline
debconf: unable to initialize frontend: Readline
debconf: (Can't locate Term/ReadLine.pm in @INC (you may need to install the Term::ReadLine module) (@INC entries checked: /etc/perl /usr/local/lib/x86_64-linux-gnu/perl/5.40.1 /usr/local/share/perl/5.40.1 /usr/lib/x86_64-linux-gnu/perl5/5.40 /usr/share/perl5 /usr/lib/x86_64-linux-gnu/perl-base /usr/lib/x86_64-linux-gnu/perl/5.40 /usr/share/perl/5.40 /usr/local/lib/site_perl) at /usr/share/perl5/Debconf/FrontEnd/Readline.pm line 8, <STDIN> line 6.)
debconf: falling back to frontend: Teletype
debconf: unable to initialize frontend: Teletype
debconf: (This frontend requires a controlling tty.)
debconf: falling back to frontend: Noninteractive
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.8  0.0  14924  9168 ?        Ss   17:23   0:00 nginx: master process nginx -g daemon off;
nginx         29  0.0  0.0  15400  3956 ?        S    17:23   0:00 nginx: worker process
nginx         30  0.0  0.0  15400  3956 ?        S    17:23   0:00 nginx: worker process
nginx         31  0.0  0.0  15400  3956 ?        S    17:23   0:00 nginx: worker process
nginx         32  0.0  0.0  15400  3956 ?        S    17:23   0:00 nginx: worker process
nginx         33  0.0  0.0  15400  3956 ?        S    17:23   0:00 nginx: worker process
nginx         34  0.0  0.0  15400  3956 ?        S    17:23   0:00 nginx: worker process
nginx         35  0.0  0.0  15400  3956 ?        S    17:23   0:00 nginx: worker process
nginx         36  0.0  0.0  15400  3876 ?        S    17:23   0:00 nginx: worker process
root          37  0.6  0.0   6400  3728 ?        Rs   17:23   0:00 ps aux

```

