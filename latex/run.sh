#!/usr/bin/env bash

# tlmgr install ctex enumitem makecell xpinyin

latexmk -xelatex pinyin.tex pinyin2.tex
latexmk -c
