![fig_0](images/img_000.png)

![fig_1](images/img_001.png)

## AI: NATURAL LANGUAGE PROCESSING & SEMANTIC ANALYSIS

BCSAI JAN-2025

PROF. DR. JUANJO MANJARÍN



---



![fig_2](images/img_002.png)

## SESSION 6: REGULAR EXPRESSIONS

Vector Space Models and Semantic Representation

![fig_3](images/img_003.png)



---



![fig_4](images/img_004.png)

## SESSION CONTENTS

- From Symbols to Spaces
- The Bag-of-Words Representation
- The Term-Document Matrix
- Words, Vectors, and Distributional Meaning
- Geometric View of Meaning
- Term Frequency-Inverse Document Frequency
- Latent Semantic Analysis
- HAL: Contextual Co-occurrence
- Practice

![fig_5](images/img_005.png)



---



## COURSE PROJECT PIPELINE

![fig_6](images/img_006.png)

![fig_7](images/img_007.png)



---



![fig_8](images/img_008.png)

## SESSION OBJECTIVES

At this point in the course, we are about to move from explicit symbolic tools to probabilistic  models  and,  later,  to  neural  architectures  such  as  transformers. Before  making  that  transition,  it  is  important  to  understand  how  raw  text becomes something a system can operate on in the first place.

Regular expressions address this layer. They do not attempt to model meaning, intention, or context. Instead, they impose structure on text, making it possible to detect formats, enforce constraints, and extract specific elements. This is why they  appear  here,  immediately  before  classifiers  and  representation-learning models: they solve problems that must be addressed before learning can even begin.

This  unit  focuses  on  turning  text  into  data.  The  central  question  is  how unstructured language can be transformed into something that can be counted, compared, weighted, and eventually classified.

The progression is conceptual as well as technical. Raw text is first structured through pattern detection, then summarized through counting and weighting, and only later fed into statistical models. Regular expressions represent the first step in this progression. They are the point at which text stops being prose and starts becoming an object of computation.

102

![fig_9](images/img_009.png)



---



![fig_10](images/img_010.png)

## WHAT ARE REGULAR EXPRESSIONS?

Regular  expressions  are  a  formal  language  for  specifying  patterns  in  text. Operationally, they define text search strings. Formally, a regular expression can be understood as an algebraic notation for characterizing a set of strings.

Originally  introduced  by  Stephen  Kleene  in  the  context  of  automata  theory, regular expressions describe families of strings using a finite set of symbols and operators. They are not arbitrary formulas, but constrained expressions whose structure corresponds to regular languages.

For example, the following regular expression describes a broad class of URLs:

\b(?:(?:https?|ftp):\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zAZ]{2,})(?:\/[^\s?#]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?\b

This pattern matches strings such as https://www.example.com http://example.co.uk/path/to/page or

The  expression  does  not ' understand ' what  a  URL  is.  It  specifies  a  structural pattern that valid URLs typically satisfy.

![fig_11](images/img_011.png)



---



![fig_12](images/img_012.png)

## REGULAR EXPRESSIONS IN THE NLP PIPELINE

In  a  realistic  NLP  pipeline,  regular  expressions  appear  early.  They  are  used during  data  cleaning,  preprocessing,  and  feature  preparation,  long  before  any classifier or neural model is applied.

Consider a raw input string such as "<p>Pay € 1,249.50 now</p>"

Before  tokenization  or  vectorization  makes  sense,  the  markup  needs  to  be removed,  and  the  relevant  value  needs  to  be  identified.  A  regular  expression can remove tags and extract the monetary amount deterministically.

In Python, this typically looks like searching or substituting patterns using the re module, long before any model sees the text.

This  role  aligns  naturally  with  the  broader  pipeline  structure  used  throughout the course, where preprocessing precedes feature extraction and modelling.

![fig_13](images/img_013.png)



---



edu

·ULAR EXPRESSIONS SOLVE

![fig_14](images/img_014.png)

## WHAT PROBLEM REGULAR EXPRESSIONS SOLVE

Regular  expressions  answer  structural  questions  about  text.  They  tell  us whether  a  string  matches  a  required  format,  where  in  the  text  a  pattern appears, and which substrings satisfy that pattern.

Take the sentence

"Contact me.home@ie.edu before 12/03/2026."

From a structural perspective, we may want to detect whether an email address appears, whether a date appears, and to extract both. A regular expression can detect  the  email  pattern  and  return  the  exact  substring  that  matches  it.  In Python, this typically involves a call such as re.search or re.findall , which returns the location and content of the match.

None of this requires understanding what the email refers to or what the date means. These are pattern-level operations, and that is precisely their scope.

![fig_15](images/img_015.png)



---



![fig_16](images/img_016.png)

## WHY REGULAR EXPRESSIONS STILL MATTER

Modern  NLP  systems  rely  heavily  on  transformers,  but  transformers  do  not eliminate the need for structure. They presuppose it.

Transformers  are  trained  on  large  volumes  of  already  normalized  text.  In practice,  before  passing  data  to  such  models,  we  often  need  to  remove boilerplate, normalize spacing, discard malformed inputs, or extract fields that should not be treated as free text.

For example, if a dataset contains log entries, identifiers, or prices embedded in text, it is rarely sensible to let a model infer their structure from scratch. A short regular expression applied in Python can enforce consistency and prevent entire classes  of  errors.  In  this  sense,  regular  expressions  protect  the  pipeline  at  its boundaries, where reliability and transparency matter most.

In practice, regular expressions are used to clean text by removing markup and noise,  to  extract  fields  such  as  dates,  prices,  or  identifiers,  to  normalize inconsistent formatting, and to filter out malformed inputs.

These operations are  often  invisible  when  models  perform  well,  but  they  are foundational. Many  failures attributed to  models  are in fact failures of preprocessing.

![fig_17](images/img_017.png)



---



## THE LIMITS OF REGULAR EXPRESSIONS

Regular  expressions  cannot  interpret  meaning,  resolve  ambiguity,  or  capture  long-range  dependencies.  From  a  regular-expression perspective, the word ' bank ' in ' the bank approved the loan ' and in ' the river bank overflowed ' is identical. This limitation motivates the introduction of statistical models and neural representations later in the course.

Regular expressions are not abandoned because they are weak or outdated. They are set aside because the nature of the problem changes.

As long as the task is to detect formats, enforce constraints, or extract explicitly defined patterns, regular expressions are often the best possible tool. They are transparent, deterministic, and efficient.

They become inadequate when variation itself becomes meaningful. When two strings differ in wording but express the same intent, or when  the  meaning  of  a  word  depends  on  context,  explicit  rules  cease  to  scale.  At  that  point,  learning  from  data  becomes  not  only convenient but necessary.

Regular expressions define what can be solved without uncertainty. Classifiers and transformers are introduced precisely to handle what remains once rules have been exhausted.

![fig_18](images/img_018.png)



---



## HOW REGULAR EXPRESSIONS SEE TEXT

Regular expressions treat text as a sequence of characters. They operate on letters, digits, punctuation, and whitespace, without access to words, syntax, or meaning.

At their core, regular expressions combine a small number of simple mechanisms into expressive patterns.

- Literal characters match themselves, wildcards match any character, and character classes define sets such as uppercase letters or digits. Quantifiers specify how many times a pattern may repeat, and anchors restrict where a match may occur within a string.
- Anchors control where patterns apply, and word boundaries prevent partial matches inside longer strings.
- Groups allow parts  of  a  pattern  to  be  isolated  and  reused.  Through  grouping,  regular  expressions  transform  unstructured  text  into structured data that can be extracted, stored, or processed further.

By default, regular expressions match as much text as possible. This greedy behaviour can lead to unexpected results when delimiters repeat or when multiple matches are possible.

![fig_19](images/img_019.png)



---



## BASIC PATTERNS

| Operator           | Behavior                                             | Example                                                |
|--------------------|------------------------------------------------------|--------------------------------------------------------|
| .                  | Wildcard, matches any character                      | c.t matches cut , cat , or cot                         |
| ^abc               | Matches some pattern abc at the start of the string  | ^abc matches abc123 but not xabc123                    |
| abc$               | Matches some pattern abc at the end of the string    | abc$ matches 123abc but not 123abcc                    |
| [abc]              | Matches any of a set of character                    | [abc] matches a , b , or c                             |
| [A-Z0-9]           | Matches any of a range of character                  | [a-z0-9] matches k or 7                                |
| ed&#124;ing&#124;s | Matches one of the specified strings (disjunction)   | ed&#124;ing&#124;s matches ed , ing , or s             |
| *                  | Zero or more of previous item (Kleene Closure)       | ab* matches a , ab , abb , abbb                        |
| +                  | One or more of previous ítem                         | ab+ matches ab , abb , but not a                       |
| ?                  | Zero or one of the previous item                     | colou?r matches color and colour                       |
| {n}                | Exactly n repeats                                    | \d{4} matches 2025                                     |
| {n,}               | At least n repeats                                   | a{2,} matches aa , aaa , aaaa                          |
| {,n}               | No more than n repeats                               | a{,3} matches a , aa , aaa                             |
| {m, n}             | At least m repeats and no more than n repeats        | a{2,4} matches aa , aaa , aaaa                         |
| a(b&#124;c)+       | Parentheses that indicate the scope of the operators | (add&#124;ing&#124;s)+ matches addings , sing , adding |

![fig_20](images/img_020.png)



---



## SPECIAL CHARACTER CLASSES AND ESCAPES

Character classes like \d , \w ,  and \s are shortcuts for common sets of characters, while their uppercase counterparts ( \D , \W , \S ) represent their complements. Some escapes, such as \b , \A , and \Z , do not match characters at all but rather positions in the string. Understanding the difference between character matches and positional matches is essential for writing correct and predictable regular expressions.

| Operator   | Behaviour                                        | Example                |
|------------|--------------------------------------------------|------------------------|
| \d         | Any digit ( 0 - 9 )                              | \d+ matches 123        |
| \D         | Any non-digit                                    | \D+ matches abc        |
| \w         | Any word character (letters, digits, underscore) | \w+ matches user_42    |
| \W         | Any non-word character                           | \W+ matches @#$        |
| \s         | Any whitespace character (space, tab, newline)   | \s+ matches spaces     |
| \S         | Any non-whitespace character                     | \S+ matches text       |
| \n         | Newline character                                | \n matches line breaks |
| \t         | Tab character                                    | \t matches tabs        |

| Operator   | Behaviour                | Example                          |
|------------|--------------------------|----------------------------------|
| \r         | Carriage return          | Rare, legacy line breaks         |
| \b         | Word boundary (position) | \bcat\b matches cat but not cats |
| \B         | Non - word boundary      | \Bcat matches scat               |
| \A         | Start of the string      | \Aabc matches abc...             |
| \Z         | End of the string        | abc\Z matches ...abc             |
| \\         | Literal backslash        | \\ matches \                     |
| \.         | Literal dot              | \. matches .                     |
| \^         | Literal caret            | \^ matches ^                     |
| \$         | Literal dollar sign      | \$120 matches $120               |

![fig_21](images/img_021.png)



---



## LOOKAROUNDS

Lookarounds are  a  special  class  of  regular  expression  constructs  that  allow  a  pattern  to  test  its  immediate  context  without  actually consuming any characters. Instead of matching text, they match positions in the string. This makes them particularly useful when we want  to  enforce  local  constraints  on  what  may  appear  before  or  after  a  match,  while  keeping  the  extracted  substring  clean  and unchanged.

For example, a lookahead can ensure that a number is followed by a percentage sign without including the sign in the match, and a lookbehind can ensure that a number is preceded by a currency symbol without capturing that symbol. Because lookarounds do not advance the matching cursor, they are best understood as contextual tests rather than matching operations, and they are often used in NLP preprocessing when precise extraction is needed without altering surrounding text.

| Lookaround   | Name                | Behavior                                                               | Example                                  |
|--------------|---------------------|------------------------------------------------------------------------|------------------------------------------|
| (?=...)      | Positive lookahead  | Matches a position only if it is followed by the specified pattern     | \d(?=%) matches 5 in 5%                  |
| (?!...)      | Negative lookahead  | Matches a position only if it is not followed by the specified pattern | a(?!n) matches a in apple but not in and |
| (?<=...)     | Positive lookbehind | Matches a position only if it is preceded by the specified pattern     | (?<=\$)\d+ matches 120 in $120           |
| (?<!...)     | Negative lookbehind | Matches a position only if it is not preceded by the specified pattern | (?<!-)cat matches cat but not -cat       |

![fig_22](images/img_022.png)