#
# Stdlib-compliant Makefile Structure
#

# VARIABLES #

ESLINT ?= ./node_modules/.bin/eslint
TAPE ?= ./node_modules/.bin/tape

# DIRECTORIES #

ROOT_DIR := $(CURDIR)
LIB_DIR := $(ROOT_DIR)/lib
TEST_DIR := $(ROOT_DIR)/test

# FILES #

JS_FILES ?= $(shell find $(LIB_DIR) $(TEST_DIR) -name "*.js" -print)
TEST_FILES ?= $(shell find $(TEST_DIR) -name "*.js" -print)


# TARGETS #

.PHONY: all lint test clean

all: lint test

lint:
	@echo "Running ESLint..."
	@$(ESLINT) $(JS_FILES) || true
	@echo "Linting complete."

test:
	@echo "Running tests..."
	@$(TAPE) $(TEST_FILES)
	@echo "Tests complete."

clean:
	@echo "Cleaning up..."
	@rm -rf node_modules
	@echo "Clean complete."
