Command Line Interface
===============
1. [Install the cli](#install-the-cli)
1. [Configure autocomplete](#configure-autocomplete)
1. [Commands](#commands)

# Install the cli
To install cli, you should type:
```sh
npm install oc -g
```

# Configure autocomplete
Autocomplete is supported for Mac and Linux.

To enable it in **zsh**, you should type:
```sh
echo '. <(oc --completion)' >> .zshrc
```

To enable it in **bash**, you should type:
```sh
oc --completion >> ~/oc.completion.sh
echo 'source ~/oc.completion.sh' >> .bash_profile
```

After enabling autocomplete you should reload the shell.

# Commands
When you type **oc** in your command line:
```sh
oc
```
you should get the list of available commands:

```sh
Usage: oc <command>

command
  dev          Runs a local oc test registry in order to develop and test components
  info         Shows installed components on the current project
  init         Creates a new empty component in the current folder
  link         Links a component in the current project
  ls           Shows the list of the available components for a linked oc registry
  preview      Runs a test page consuming a component
  publish      Publish a component
  registry     Shows, adds, removes oc registries to the current project
  unlink       Unlinks a component from the current project
  version      Shows the cli version

Hint: Run -h with any command to show the help
```
