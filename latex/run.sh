#!/usr/bin/env bash

# tlmgr install ctex enumitem makecell xpinyin fancyhdr

latexmk -xelatex pinyin.tex pinyin-full.tex pinyin-lite.tex
latexmk -c
