# Please respect package contribution norms and
# use this standard commit script

MSG="$(curl -X GET 'https://whatthecommit.com/index.txt')"

git commit -m "$MSG"
