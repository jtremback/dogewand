## What is ansible-postgres? [![Build Status](https://secure.travis-ci.org/nickjj/ansible-postgres.png)](http://travis-ci.org/nickjj/ansible-postgres)

It is an [ansible](http://www.ansible.com/home) role to install postgres 9.3.

### What problem does it solve and why is it useful?

Often times you just want a single database server without any fuss or headaches. The only thing you need to supply to this role is the username/password it should use for the postgres user account and you're on your way.

It also allows you to configure a few popular configuration options if you need to stray off the path of the default settings.

## Role variables

```
---
# A list of 1 or more hosts to listen on.
postgres_listen_addresses:
  - 0.0.0.0

# Which port should the host listen on?
postgres_port: 5432

# The postgres username and password.
postgres_username: deploy
postgres_password: pleasedonthackme

# How should logs be reported?
# It can be: stderr (default), syslog or eventlog.
postgres_log_destination: stderr

# Configuration settings for syslog.
postgres_syslog_facility: LOCAL0
postgres_syslog_ident: postgres

# Allow access from remote hosts, explained more below.
postgres_allowed_hosts: []

# The amount in seconds to cache apt-update.
apt_cache_valid_time: 86400
```

### Allow remote hosts to access your postgres server

If your database is on a different host than the servers using your postgres connection then you need to white list them in your hba config. You can do that by populating `postgres_allowed_hosts`.


```
postgres_allowed_hosts:
    # What list of IPs are allowed to connect?
    # OPTIONAL: Defaults to [] (only localhost can connect).
  - hosts: []

    # What network interface should be used?
    # OPTIONAL: Defaults to eth0.
    interface: "eth0"

    # How is the connection to the server made?
    # OPTIONAL: Defaults to host.
    # VALUES: local, host, hostssl or hostnossl
    type: "host"

    # What database can the connection be made to?
    # OPTIONAL: Defaults to all.
    database: "all"

    # Which user can make the connection?
    # OPTIONAL: Defaults to all.
    user: "all"

    # How should the user authenticate?
    # OPTIONAL: Defaults to md5.
    auth: "md5"
```

## Example playbook

For the sake of this example let's say you have a group called **database** and you have a typical `site.yml` file.

To use this role edit your `site.yml` file to look something like this:

```
---
- name: ensure database servers are configured
  hosts: database

  roles:
    - { role: nickjj.postgres, tags: postgres }
```

Let's say you want to edit a few defaults, you can do this by opening or creating `group_vars/app.yml` which is located relative to your `inventory` directory and then making it look something like this:

```
---
postgres_user: hulk
postgres_password: notverysecure
postgres_log_destination: syslog

postgres_remote_hosts:
  - hosts: "{{ groups['my_rails_apps'] }}"

# If you wanted to add multiple groups or servers...
postgres_remote_hosts:
  - hosts: "{{ groups['my_rails_apps'] }}"
  - hosts: "{{ groups['my_golang_apps'] }}"
    interface: "eth1"
  - hosts: ["www.sometrustworthy.com"]
    auth: "trust"
```

#### More secure passwords

If you plan to publish your inventory somewhere and you do not want plain text passwords to be checked in then you must remove the password out of this file. You can use ansible's `lookup` module to have the password stored locally outside of version control and then load it into your inventory. Here is an example:

```
postgres_password: "{{ lookup('password', '/path/to/secrets/' + 'database_password') }}"
```

In the above case `database_password` would be a text file containing your password. You can encrypt this file on your local file system if you want but that is outside of the scope of this documentation.

## Installation

`$ ansible-galaxy install nickjj.postgres`

## Requirements

Tested on ubuntu 12.04 LTS and debian wheezy but it should work on other versions that are similar.

## Ansible galaxy

You can find it on the official [ansible galaxy](https://galaxy.ansible.com/list#/roles/867) if you want to rate it.

## License

MIT
